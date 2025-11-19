/**
 * Workflow Tracking Tests
 *
 * Tests for workflow state tracking utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  startWorkflowRun,
  completeWorkflowRun,
  failWorkflowRun,
  getWorkflowRun,
  getRecentWorkflowRuns,
  executeWithTracking,
} from '../../utils/workflow-tracking';

// Mock the repository
vi.mock('@/lib/db/repositories', () => ({
  workflowRunRepository: {
    create: vi.fn(),
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
  },
}));

import { workflowRunRepository } from '@/lib/db/repositories';

describe('Workflow Tracking Utilities', () => {
  const mockWorkflowRun = {
    id: '00000000-0000-0000-0000-000000000001',
    workflowName: 'test-workflow',
    status: 'running',
    input: { test: true },
    output: null,
    error: null,
    startedAt: new Date('2025-01-15T12:00:00Z'),
    completedAt: null,
    metadata: {},
    createdAt: new Date('2025-01-15T12:00:00Z'),
    updatedAt: new Date('2025-01-15T12:00:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startWorkflowRun', () => {
    it('should create a new workflow run', async () => {
      vi.mocked(workflowRunRepository.create).mockResolvedValue(mockWorkflowRun);

      const result = await startWorkflowRun('test-workflow', { test: true });

      expect(workflowRunRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowName: 'test-workflow',
          status: 'running',
          input: { test: true },
        })
      );
      expect(result.id).toBe(mockWorkflowRun.id);
      expect(result.status).toBe('running');
    });

    it('should throw on creation failure', async () => {
      vi.mocked(workflowRunRepository.create).mockRejectedValue(new Error('DB error'));

      await expect(startWorkflowRun('test-workflow', {})).rejects.toThrow(
        'Failed to start workflow run'
      );
    });
  });

  describe('completeWorkflowRun', () => {
    it('should mark workflow as completed', async () => {
      const completedRun = {
        ...mockWorkflowRun,
        status: 'completed',
        output: { result: 'success' },
        completedAt: new Date('2025-01-15T12:05:00Z'),
      };
      vi.mocked(workflowRunRepository.markCompleted).mockResolvedValue(completedRun);

      const result = await completeWorkflowRun(mockWorkflowRun.id, { result: 'success' });

      expect(workflowRunRepository.markCompleted).toHaveBeenCalledWith(
        mockWorkflowRun.id,
        { result: 'success' }
      );
      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
    });

    it('should throw on completion failure', async () => {
      vi.mocked(workflowRunRepository.markCompleted).mockRejectedValue(new Error('DB error'));

      await expect(
        completeWorkflowRun(mockWorkflowRun.id, {})
      ).rejects.toThrow('Failed to complete workflow run');
    });
  });

  describe('failWorkflowRun', () => {
    it('should mark workflow as failed with error message', async () => {
      const failedRun = {
        ...mockWorkflowRun,
        status: 'failed',
        error: 'Test error',
        completedAt: new Date('2025-01-15T12:05:00Z'),
      };
      vi.mocked(workflowRunRepository.markFailed).mockResolvedValue(failedRun);

      const result = await failWorkflowRun(mockWorkflowRun.id, 'Test error');

      expect(workflowRunRepository.markFailed).toHaveBeenCalledWith(
        mockWorkflowRun.id,
        'Test error'
      );
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Test error');
    });

    it('should accept Error object', async () => {
      const failedRun = {
        ...mockWorkflowRun,
        status: 'failed',
        error: 'Error message',
        completedAt: new Date('2025-01-15T12:05:00Z'),
      };
      vi.mocked(workflowRunRepository.markFailed).mockResolvedValue(failedRun);

      await failWorkflowRun(mockWorkflowRun.id, new Error('Error message'));

      expect(workflowRunRepository.markFailed).toHaveBeenCalledWith(
        mockWorkflowRun.id,
        'Error message'
      );
    });

    it('should throw on failure update error', async () => {
      vi.mocked(workflowRunRepository.markFailed).mockRejectedValue(new Error('DB error'));

      await expect(
        failWorkflowRun(mockWorkflowRun.id, 'Test error')
      ).rejects.toThrow('Failed to mark workflow run as failed');
    });
  });

  describe('getWorkflowRun', () => {
    it('should return workflow run by id', async () => {
      vi.mocked(workflowRunRepository.findById).mockResolvedValue(mockWorkflowRun);

      const result = await getWorkflowRun(mockWorkflowRun.id);

      expect(workflowRunRepository.findById).toHaveBeenCalledWith(mockWorkflowRun.id);
      expect(result).toEqual(mockWorkflowRun);
    });

    it('should return null when not found', async () => {
      vi.mocked(workflowRunRepository.findById).mockResolvedValue(null);

      const result = await getWorkflowRun('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw on find error', async () => {
      vi.mocked(workflowRunRepository.findById).mockRejectedValue(new Error('DB error'));

      await expect(getWorkflowRun('id')).rejects.toThrow('Failed to get workflow run');
    });
  });

  describe('getRecentWorkflowRuns', () => {
    it('should return recent workflow runs with default options', async () => {
      const runs = [mockWorkflowRun];
      vi.mocked(workflowRunRepository.findAll).mockResolvedValue(runs);

      const result = await getRecentWorkflowRuns();

      expect(workflowRunRepository.findAll).toHaveBeenCalledWith({
        workflowName: undefined,
        status: undefined,
        limit: 50,
        offset: 0,
      });
      expect(result).toEqual(runs);
    });

    it('should apply filter options', async () => {
      vi.mocked(workflowRunRepository.findAll).mockResolvedValue([]);

      await getRecentWorkflowRuns({
        workflowName: 'test-workflow',
        status: 'completed',
        limit: 10,
        offset: 5,
      });

      expect(workflowRunRepository.findAll).toHaveBeenCalledWith({
        workflowName: 'test-workflow',
        status: 'completed',
        limit: 10,
        offset: 5,
      });
    });

    it('should throw on find error', async () => {
      vi.mocked(workflowRunRepository.findAll).mockRejectedValue(new Error('DB error'));

      await expect(getRecentWorkflowRuns()).rejects.toThrow(
        'Failed to get recent workflow runs'
      );
    });
  });

  describe('executeWithTracking', () => {
    it('should track successful execution', async () => {
      vi.mocked(workflowRunRepository.create).mockResolvedValue(mockWorkflowRun);
      vi.mocked(workflowRunRepository.markCompleted).mockResolvedValue({
        ...mockWorkflowRun,
        status: 'completed',
        output: { result: 'success' },
        completedAt: new Date(),
      });

      const executor = vi.fn().mockResolvedValue({ result: 'success' });

      const result = await executeWithTracking('test-workflow', { input: 'data' }, executor);

      expect(workflowRunRepository.create).toHaveBeenCalled();
      expect(executor).toHaveBeenCalledWith(mockWorkflowRun.id);
      expect(workflowRunRepository.markCompleted).toHaveBeenCalledWith(
        mockWorkflowRun.id,
        { result: 'success' }
      );
      expect(result.runId).toBe(mockWorkflowRun.id);
      expect(result.output).toEqual({ result: 'success' });
    });

    it('should track failed execution', async () => {
      vi.mocked(workflowRunRepository.create).mockResolvedValue(mockWorkflowRun);
      vi.mocked(workflowRunRepository.markFailed).mockResolvedValue({
        ...mockWorkflowRun,
        status: 'failed',
        error: 'Executor failed',
        completedAt: new Date(),
      });

      const executor = vi.fn().mockRejectedValue(new Error('Executor failed'));

      await expect(
        executeWithTracking('test-workflow', {}, executor)
      ).rejects.toThrow('Executor failed');

      expect(workflowRunRepository.create).toHaveBeenCalled();
      expect(workflowRunRepository.markFailed).toHaveBeenCalledWith(
        mockWorkflowRun.id,
        expect.any(String)
      );
    });

    it('should pass runId to executor', async () => {
      vi.mocked(workflowRunRepository.create).mockResolvedValue(mockWorkflowRun);
      vi.mocked(workflowRunRepository.markCompleted).mockResolvedValue({
        ...mockWorkflowRun,
        status: 'completed',
        completedAt: new Date(),
      });

      const executor = vi.fn().mockImplementation((runId: string) => {
        return Promise.resolve({ executedWith: runId });
      });

      const result = await executeWithTracking('test-workflow', {}, executor);

      expect(executor).toHaveBeenCalledWith(mockWorkflowRun.id);
      expect(result.output.executedWith).toBe(mockWorkflowRun.id);
    });
  });
});
