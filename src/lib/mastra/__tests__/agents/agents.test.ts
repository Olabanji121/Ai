/**
 * AI Agent Tests
 *
 * Tests for AI agent creation and configuration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the AI SDK providers
vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn().mockReturnValue({
    chat: vi.fn(),
  }),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn().mockReturnValue({
    chat: vi.fn(),
  }),
}));

// Mock Mastra
vi.mock('@mastra/core', () => ({
  Agent: class MockAgent {
    name: string;
    instructions: string;
    model: unknown;
    tools: Record<string, unknown>;

    constructor(config: {
      name: string;
      instructions: string;
      model: unknown;
      tools?: Record<string, unknown>;
    }) {
      this.name = config.name;
      this.instructions = config.instructions;
      this.model = config.model;
      this.tools = config.tools || {};
    }

    async generate(_prompt: string) {
      return {
        text: JSON.stringify({ result: 'mock response' }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      };
    }
  },
  createTool: vi.fn().mockImplementation((config) => ({
    id: config.id,
    description: config.description,
    execute: config.execute || vi.fn(),
  })),
}));

// Import after mocks
import {
  trendDiscoveryAgent,
  contentGenerationAgent,
  contentOptimizerAgent,
} from '../../agents';

describe('AI Agents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trendDiscoveryAgent', () => {
    it('should be defined', () => {
      expect(trendDiscoveryAgent).toBeDefined();
    });

    it('should have correct name', () => {
      expect(trendDiscoveryAgent.name).toBe('trend-discovery-agent');
    });

    it('should have instructions', () => {
      expect(trendDiscoveryAgent.instructions).toBeDefined();
      expect(trendDiscoveryAgent.instructions.length).toBeGreaterThan(0);
    });

    it('should have model configured', () => {
      expect(trendDiscoveryAgent.model).toBeDefined();
    });

    it('should generate responses', async () => {
      const result = await trendDiscoveryAgent.generate('Test prompt');

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
    });
  });

  describe('contentGenerationAgent', () => {
    it('should be defined', () => {
      expect(contentGenerationAgent).toBeDefined();
    });

    it('should have correct name', () => {
      expect(contentGenerationAgent.name).toBe('content-generation-agent');
    });

    it('should have instructions', () => {
      expect(contentGenerationAgent.instructions).toBeDefined();
      expect(contentGenerationAgent.instructions.length).toBeGreaterThan(0);
    });

    it('should have model configured', () => {
      expect(contentGenerationAgent.model).toBeDefined();
    });

    it('should generate responses', async () => {
      const result = await contentGenerationAgent.generate('Test prompt');

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
    });
  });

  describe('contentOptimizerAgent', () => {
    it('should be defined', () => {
      expect(contentOptimizerAgent).toBeDefined();
    });

    it('should have correct name', () => {
      expect(contentOptimizerAgent.name).toBe('content-optimizer-agent');
    });

    it('should have instructions', () => {
      expect(contentOptimizerAgent.instructions).toBeDefined();
      expect(contentOptimizerAgent.instructions.length).toBeGreaterThan(0);
    });

    it('should have model configured', () => {
      expect(contentOptimizerAgent.model).toBeDefined();
    });

    it('should generate responses', async () => {
      const result = await contentOptimizerAgent.generate('Test prompt');

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
    });
  });

  describe('Agent Instructions', () => {
    it('should have unique instructions per agent', () => {
      expect(trendDiscoveryAgent.instructions).not.toBe(
        contentGenerationAgent.instructions
      );
      expect(contentGenerationAgent.instructions).not.toBe(
        contentOptimizerAgent.instructions
      );
    });

    it('trend discovery should mention trend analysis', () => {
      expect(trendDiscoveryAgent.instructions.toLowerCase()).toContain('trend');
    });

    it('content generation should mention content creation', () => {
      expect(contentGenerationAgent.instructions.toLowerCase()).toContain('content');
    });

    it('content optimizer should mention optimization', () => {
      expect(contentOptimizerAgent.instructions.toLowerCase()).toContain('optim');
    });
  });
});
