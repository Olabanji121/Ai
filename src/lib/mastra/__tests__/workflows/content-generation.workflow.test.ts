/**
 * Content Generation Workflow Tests
 *
 * Tests for the content generation workflow execution
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runContentGenerationWorkflow } from '../../workflows/content-generation.workflow';
// Valid test UUIDs that pass Zod validation
const testUuids = {
  run: '11111111-1111-4111-a111-111111111111',
  trend: '22222222-2222-4222-a222-222222222222',
  settings: '33333333-3333-4333-a333-333333333333',
  user: '44444444-4444-4444-a444-444444444444',
};

// Mock dependencies
vi.mock('@/lib/db/repositories', () => ({
  workflowRunRepository: {
    create: vi.fn(),
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
  },
  trendRepository: {
    findById: vi.fn(),
    findTopTrends: vi.fn(),
    markAsUsed: vi.fn(),
  },
  userSettingsRepository: {
    findByUserId: vi.fn(),
  },
}));

vi.mock('../../agents', () => ({
  contentGenerationAgent: {
    generate: vi.fn(),
  },
}));

import { workflowRunRepository, trendRepository, userSettingsRepository } from '@/lib/db/repositories';
import { contentGenerationAgent } from '../../agents';

describe('Content Generation Workflow', () => {
  const mockWorkflowRun = {
    id: testUuids.run,
    workflowName: 'content-generation',
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

  const mockTrend = {
    id: testUuids.trend,
    title: 'AI Revolution',
    hook: 'How AI is changing everything',
    source: 'reddit',
    score: 92,
    sentiment: 'positive',
    category: 'technology',
    metadata: {},
    status: 'new' as const,
    usedForContent: false,
    embedding: null,
    discoveredAt: new Date(),
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserSettings = {
    id: testUuids.settings,
    userId: testUuids.user,
    brandVoice: 'Professional and engaging',
    targetAudience: 'Tech professionals',
    platforms: ['twitter', 'linkedin'],
    autoPublish: false,
    postingSchedule: {},
    tonePreferences: {},
    contentGuidelines: {},
    notificationPreferences: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(workflowRunRepository.create).mockResolvedValue(mockWorkflowRun);
    vi.mocked(workflowRunRepository.markCompleted).mockResolvedValue({
      ...mockWorkflowRun,
      status: 'completed',
      completedAt: new Date(),
    });
    vi.mocked(trendRepository.findById).mockResolvedValue(mockTrend);
    vi.mocked(trendRepository.findTopTrends).mockResolvedValue([mockTrend]);
    vi.mocked(trendRepository.markAsUsed).mockResolvedValue({
      ...mockTrend,
      usedForContent: true,
      status: 'completed' as const,
    });
    vi.mocked(userSettingsRepository.findByUserId).mockResolvedValue(mockUserSettings);
    vi.mocked(contentGenerationAgent.generate).mockResolvedValue({
      text: JSON.stringify({ posts: [] }),
    });
  });

  describe('runContentGenerationWorkflow', () => {
    it('should execute workflow with user and auto-selected trend', async () => {
      const input = {
        userId: testUuids.user,
        autoSelectTrend: true,
      };

      const result = await runContentGenerationWorkflow(input);

      expect(result.runId).toBe(testUuids.run);
      expect(result.output).toBeDefined();
      expect(result.output.generatedPosts).toBeDefined();
      expect(result.output.posts).toBeDefined();
      expect(result.output.trendUsed).toBeDefined();
      expect(result.output.brandVoiceMatch).toBeDefined();
    });

    it('should use specified trend', async () => {
      const input = {
        userId: testUuids.user,
        trendId: testUuids.trend,
        autoSelectTrend: false,
      };

      await runContentGenerationWorkflow(input);

      expect(trendRepository.findById).toHaveBeenCalledWith(testUuids.trend);
      expect(trendRepository.findTopTrends).not.toHaveBeenCalled();
    });

    it('should auto-select top trend when trendId not provided', async () => {
      const input = {
        userId: testUuids.user,
        autoSelectTrend: true,
      };

      await runContentGenerationWorkflow(input);

      expect(trendRepository.findTopTrends).toHaveBeenCalledWith(1);
    });

    it('should use specified platforms', async () => {
      const input = {
        userId: testUuids.user,
        platforms: ['twitter' as const, 'reddit' as const],
      };

      const result = await runContentGenerationWorkflow(input);

      expect(result.output.generatedPosts).toBe(2);
      expect(result.output.posts).toHaveLength(2);
    });

    it('should include custom instructions in prompt', async () => {
      const input = {
        userId: testUuids.user,
        customInstructions: 'Focus on data visualization',
      };

      await runContentGenerationWorkflow(input);

      const prompt = vi.mocked(contentGenerationAgent.generate).mock.calls[0][0];
      expect(prompt).toContain('Focus on data visualization');
    });

    it('should mark trend as used after generation', async () => {
      const input = {
        userId: testUuids.user,
      };

      await runContentGenerationWorkflow(input);

      expect(trendRepository.markAsUsed).toHaveBeenCalledWith(mockTrend.id);
    });

    it('should throw error when user settings not found', async () => {
      vi.mocked(userSettingsRepository.findByUserId).mockResolvedValue(null);
      vi.mocked(workflowRunRepository.markFailed).mockResolvedValue({
        ...mockWorkflowRun,
        status: 'failed',
        completedAt: new Date(),
      });

      await expect(
        runContentGenerationWorkflow({
          userId: 'nonexistent',
        })
      ).rejects.toThrow('User settings not found');
    });

    it('should throw error when no trend available', async () => {
      vi.mocked(trendRepository.findTopTrends).mockResolvedValue([]);
      vi.mocked(workflowRunRepository.markFailed).mockResolvedValue({
        ...mockWorkflowRun,
        status: 'failed',
        completedAt: new Date(),
      });

      await expect(
        runContentGenerationWorkflow({
          userId: testUuids.user,
          autoSelectTrend: true,
        })
      ).rejects.toThrow('No trend available');
    });

    it('should track workflow state', async () => {
      await runContentGenerationWorkflow({
        userId: testUuids.user,
      });

      expect(workflowRunRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowName: 'content-generation',
          status: 'running',
        })
      );
      expect(workflowRunRepository.markCompleted).toHaveBeenCalled();
    });

    it('should generate posts for user platforms by default', async () => {
      const input = {
        userId: testUuids.user,
      };

      const result = await runContentGenerationWorkflow(input);

      // Uses user's default platforms from settings
      expect(result.output.posts.length).toBeGreaterThan(0);
    });

    it('should return trend information in output', async () => {
      const result = await runContentGenerationWorkflow({
        userId: testUuids.user,
      });

      expect(result.output.trendUsed.id).toBe(mockTrend.id);
      expect(result.output.trendUsed.title).toBe(mockTrend.title);
      expect(result.output.trendUsed.score).toBe(mockTrend.score);
    });
  });
});
