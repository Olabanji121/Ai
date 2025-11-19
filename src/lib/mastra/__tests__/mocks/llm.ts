/**
 * Mock LLM Responses for Mastra Tests
 *
 * Provides mock responses for AI agent testing without making actual LLM calls.
 */

import { vi } from 'vitest';

/**
 * Mock trend discovery response
 */
export const mockTrendDiscoveryResponse = {
  text: JSON.stringify({
    trends: [
      {
        title: 'AI Revolution in Marketing',
        hook: 'How AI is transforming digital marketing strategies',
        source: 'reddit',
        score: 92,
        sentiment: 'positive',
        category: 'technology',
        metadata: {
          subreddit: 'marketing',
          upvotes: 2500,
          comments: 150,
        },
      },
      {
        title: 'Remote Work 2025',
        hook: 'The evolution of remote work culture',
        source: 'twitter',
        score: 88,
        sentiment: 'positive',
        category: 'business',
        metadata: {
          hashtag: '#remotework',
          retweets: 1200,
        },
      },
    ],
    recommendations: [
      'Focus on AI-related content',
      'Leverage remote work trends',
    ],
  }),
  usage: {
    promptTokens: 500,
    completionTokens: 300,
    totalTokens: 800,
  },
};

/**
 * Mock content generation response
 */
export const mockContentGenerationResponse = {
  text: JSON.stringify({
    posts: [
      {
        platform: 'twitter',
        content: '🚀 AI is revolutionizing marketing! Here are 3 ways to stay ahead...',
        hashtags: ['#AI', '#Marketing', '#DigitalTransformation'],
        characterCount: 120,
      },
      {
        platform: 'linkedin',
        content: 'The marketing landscape is evolving rapidly with AI at its core. As professionals, we need to adapt...',
        hashtags: ['#AIMarketing', '#Leadership'],
        characterCount: 450,
      },
    ],
    brandVoiceScore: 85,
    recommendations: ['Consider adding more data-driven insights', 'Include a call-to-action'],
  }),
  usage: {
    promptTokens: 400,
    completionTokens: 250,
    totalTokens: 650,
  },
};

/**
 * Mock content optimization response
 */
export const mockContentOptimizationResponse = {
  text: JSON.stringify({
    optimizedContent: '🚀 AI is revolutionizing marketing! Here are 3 proven ways to stay ahead of the curve...',
    improvements: [
      { type: 'clarity', description: 'Added "proven" for credibility' },
      { type: 'engagement', description: 'Extended hook for better retention' },
    ],
    scores: {
      readability: 92,
      engagement: 88,
      seo: 85,
      overall: 88,
    },
    suggestions: ['Consider A/B testing different CTAs', 'Add relevant statistics'],
  }),
  usage: {
    promptTokens: 300,
    completionTokens: 200,
    totalTokens: 500,
  },
};

/**
 * Mock error response for testing error handling
 */
export const mockErrorResponse = {
  error: {
    message: 'Rate limit exceeded',
    code: 'rate_limit_exceeded',
  },
};

/**
 * Create a mock agent generate function
 */
export function createMockAgentGenerate(response: { text: string; usage: object }) {
  return vi.fn().mockResolvedValue(response);
}

/**
 * Create a mock agent that throws an error
 */
export function createMockAgentGenerateError(errorMessage: string) {
  return vi.fn().mockRejectedValue(new Error(errorMessage));
}

/**
 * Mock the entire agent module
 */
export function mockMastraAgents() {
  return {
    trendDiscoveryAgent: {
      generate: createMockAgentGenerate(mockTrendDiscoveryResponse),
    },
    contentGenerationAgent: {
      generate: createMockAgentGenerate(mockContentGenerationResponse),
    },
    contentOptimizerAgent: {
      generate: createMockAgentGenerate(mockContentOptimizationResponse),
    },
  };
}

/**
 * Mock delayed response for timeout testing
 */
export function createMockAgentGenerateDelayed(response: { text: string; usage: object }, delayMs: number) {
  return vi.fn().mockImplementation(async () => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return response;
  });
}

/**
 * Mock transient error for retry testing
 */
export function createMockAgentTransientError(successOnAttempt: number, response: { text: string; usage: object }) {
  let attempts = 0;
  return vi.fn().mockImplementation(async () => {
    attempts++;
    if (attempts < successOnAttempt) {
      throw new Error('ECONNRESET');
    }
    return response;
  });
}
