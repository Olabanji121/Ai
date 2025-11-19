/**
 * Cron Scheduler Tests
 *
 * Tests for workflow scheduling functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startScheduler,
  stopScheduler,
  isSchedulerActive,
  getSchedulerStatus,
  triggerScheduledJob,
} from '../../cron/scheduler';

// Mock dependencies
vi.mock('@/lib/db/repositories', () => ({
  workflowRunRepository: {
    create: vi.fn(),
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
  },
}));

import { workflowRunRepository } from '@/lib/db/repositories';

describe('Cron Scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Stop scheduler if running
    if (isSchedulerActive()) {
      stopScheduler();
    }

    // Setup default mocks
    const mockRun = {
      id: '00000000-0000-0000-0000-000000000001',
      workflowName: 'test',
      status: 'running',
      input: {},
      output: null,
      error: null,
      startedAt: new Date(),
      completedAt: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(workflowRunRepository.create).mockResolvedValue(mockRun);
    vi.mocked(workflowRunRepository.markCompleted).mockResolvedValue({
      ...mockRun,
      status: 'completed',
      completedAt: new Date(),
    });
  });

  afterEach(() => {
    if (isSchedulerActive()) {
      stopScheduler();
    }
    vi.useRealTimers();
  });

  describe('startScheduler', () => {
    it('should start scheduler', () => {
      expect(isSchedulerActive()).toBe(false);

      startScheduler();

      expect(isSchedulerActive()).toBe(true);
    });

    it('should warn if already running', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      startScheduler();
      startScheduler(); // Second call should warn

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already running')
      );
      consoleSpy.mockRestore();
    });

    it('should log scheduled jobs', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      startScheduler();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('stopScheduler', () => {
    it('should stop scheduler', () => {
      startScheduler();
      expect(isSchedulerActive()).toBe(true);

      stopScheduler();
      expect(isSchedulerActive()).toBe(false);
    });

    it('should warn if not running', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      stopScheduler();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('not running')
      );
      consoleSpy.mockRestore();
    });

    it('should clear all intervals', () => {
      startScheduler();
      const status = getSchedulerStatus();
      expect(status.activeJobs).toBeGreaterThan(0);

      stopScheduler();
      const statusAfter = getSchedulerStatus();
      expect(statusAfter.activeJobs).toBe(0);
    });
  });

  describe('isSchedulerActive', () => {
    it('should return false when not started', () => {
      expect(isSchedulerActive()).toBe(false);
    });

    it('should return true when started', () => {
      startScheduler();
      expect(isSchedulerActive()).toBe(true);
    });

    it('should return false after stopped', () => {
      startScheduler();
      stopScheduler();
      expect(isSchedulerActive()).toBe(false);
    });
  });

  describe('getSchedulerStatus', () => {
    it('should return status when not running', () => {
      const status = getSchedulerStatus();

      expect(status.running).toBe(false);
      expect(status.activeJobs).toBe(0);
      expect(status.jobs).toBeDefined();
      expect(status.jobs.length).toBeGreaterThan(0);
    });

    it('should return status when running', () => {
      startScheduler();
      const status = getSchedulerStatus();

      expect(status.running).toBe(true);
      expect(status.activeJobs).toBeGreaterThan(0);
    });

    it('should include job details', () => {
      const status = getSchedulerStatus();

      status.jobs.forEach((job) => {
        expect(job.id).toBeDefined();
        expect(job.name).toBeDefined();
        expect(job.schedule).toBeDefined();
        expect(typeof job.enabled).toBe('boolean');
      });
    });
  });

  describe('triggerScheduledJob', () => {
    it('should trigger job manually', async () => {
      const status = getSchedulerStatus();
      const enabledJob = status.jobs.find((j) => j.enabled);

      if (enabledJob) {
        await triggerScheduledJob(enabledJob.id);

        expect(workflowRunRepository.create).toHaveBeenCalled();
      }
    });

    it('should throw error for nonexistent job', async () => {
      await expect(triggerScheduledJob('nonexistent-job')).rejects.toThrow(
        'Cron job not found'
      );
    });
  });

  describe('Scheduled Execution', () => {
    it('should execute workflows on schedule', async () => {
      startScheduler();

      // Advance time by 6 hours (one of the scheduled intervals)
      await vi.advanceTimersByTimeAsync(6 * 60 * 60 * 1000);

      // Check that workflows were executed
      expect(workflowRunRepository.create).toHaveBeenCalled();
    });

    it('should not execute workflows when stopped', async () => {
      startScheduler();
      stopScheduler();

      // Advance time
      await vi.advanceTimersByTimeAsync(6 * 60 * 60 * 1000);

      // Should not have executed any workflows
      expect(workflowRunRepository.create).not.toHaveBeenCalled();
    });
  });
});
