/**
 * Trend Discovery Workflow Tests
 *
 * Tests for the trend discovery workflow execution
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runTrendDiscoveryWorkflow } from '../../workflows/trend-discovery.workflow';
import { testFactories, testUuid } from '@/lib/db/__tests__/setup';

// Mock dependencies
vi.mock('@/lib/db/repositories', () => ({
  workflowRunRepository: {
    create: vi.fn(),
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
  },
  trendRepository: {
    create: vi.fn(),
    findAll: vi.fn(),
  },
}));

vi.mock('../../agents', () => ({
  trendDiscoveryAgent: {
    generate: vi.fn(),
  },
}));

import { workflowRunRepository } from '@/lib/db/repositories';
import { trendDiscoveryAgent } from '../../agents';

describe('Trend Discovery Workflow', () => {
  const mockWorkflowRun = {
    id: testUuid(1),
    workflowName: 'trend-discovery',
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

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(workflowRunRepository.create).mockResolvedValue(mockWorkflowRun);
    vi.mocked(workflowRunRepository.markCompleted).mockResolvedValue({
      ...mockWorkflowRun,
      status: 'completed',
      completedAt: new Date(),
    });
    vi.mocked(trendDiscoveryAgent.generate).mockResolvedValue({
      text: JSON.stringify({ trends: [] }),
    });
  });

  describe('runTrendDiscoveryWorkflow', () => {
    it('should execute workflow with default input', async () => {
      const result = await runTrendDiscoveryWorkflow({});

      expect(result.runId).toBe(testUuid(1));
      expect(result.output).toBeDefined();
      expect(result.output.processedTrends).toBeDefined();
      expect(result.output.storedTrends).toBeDefined();
      expect(result.output.topTrends).toBeDefined();
      expect(result.output.recommendations).toBeDefined();
      expect(result.output.executionTime).toBeDefined();
    });

    it('should use specified sources', async () => {
      const input = {
        sources: ['reddit' as const],
        minScore: 80,
        maxTrends: 10,
      };

      const result = await runTrendDiscoveryWorkflow(input);

      expect(trendDiscoveryAgent.generate).toHaveBeenCalled();
      const prompt = vi.mocked(trendDiscoveryAgent.generate).mock.calls[0][0];
      expect(prompt).toContain('reddit');
      expect(result.output).toBeDefined();
    });

    it('should filter by minimum score', async () => {
      const input = {
        minScore: 90,
      };

      await runTrendDiscoveryWorkflow(input);

      const prompt = vi.mocked(trendDiscoveryAgent.generate).mock.calls[0][0];
      expect(prompt).toContain('90');
    });

    it('should limit trends by maxTrends', async () => {
      const input = {
        maxTrends: 5,
      };

      const result = await runTrendDiscoveryWorkflow(input);

      expect(result.output.processedTrends).toBe(5);
    });

    it('should track workflow state', async () => {
      await runTrendDiscoveryWorkflow({});

      expect(workflowRunRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowName: 'trend-discovery',
          status: 'running',
        })
      );
      expect(workflowRunRepository.markCompleted).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      await expect(
        runTrendDiscoveryWorkflow({
          minScore: 150, // Invalid - max is 100
        })
      ).rejects.toThrow();
    });

    it('should handle agent errors', async () => {
      vi.mocked(trendDiscoveryAgent.generate).mockRejectedValue(
        new Error('LLM API error')
      );
      vi.mocked(workflowRunRepository.markFailed).mockResolvedValue({
        ...mockWorkflowRun,
        status: 'failed',
        error: 'LLM API error',
        completedAt: new Date(),
      });

      await expect(runTrendDiscoveryWorkflow({})).rejects.toThrow('LLM API error');
      expect(workflowRunRepository.markFailed).toHaveBeenCalled();
    });

    it('should return recommendations', async () => {
      const result = await runTrendDiscoveryWorkflow({});

      expect(result.output.recommendations).toBeInstanceOf(Array);
      expect(result.output.recommendations.length).toBeGreaterThan(0);
    });

    it('should measure execution time', async () => {
      const result = await runTrendDiscoveryWorkflow({});

      expect(result.output.executionTime).toBeGreaterThanOrEqual(0);
    });
  });
});
