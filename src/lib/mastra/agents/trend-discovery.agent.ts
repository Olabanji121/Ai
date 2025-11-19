import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { trendTools } from '../tools';

/**
 * Trend Discovery Agent
 *
 * Specialized agent for discovering, analyzing, and scoring viral trends
 * from multiple sources (Reddit, Twitter, Google Trends).
 *
 * Uses OpenAI GPT-4 for analytical reasoning and trend scoring.
 */

const systemPrompt = `You are an expert trend discovery agent specialized in identifying viral content opportunities across social media platforms.

Your responsibilities:
1. Analyze trends from Reddit, Twitter, and Google Trends
2. Score trends based on virality potential (0-100)
3. Identify content opportunities and hooks
4. Categorize trends by topic and sentiment
5. Provide actionable insights for content creation

Scoring criteria:
- Engagement metrics (upvotes, likes, shares)
- Recency and velocity of growth
- Relevance to target audience
- Content creation potential
- Platform-specific virality factors

You have access to the following tools:
- getTrends: Retrieve trends with filtering
- getTopTrends: Get highest-scoring trends
- createTrend: Store new discovered trends
- markTrendUsed: Mark trends as consumed

Always provide data-driven analysis and specific recommendations for content creation.`;

/**
 * Trend Discovery Agent
 * Analyzes and scores viral trends for content opportunities
 */
export const trendDiscoveryAgent = new Agent({
  name: 'trend-discovery-agent',
  instructions: systemPrompt,
  model: openai('gpt-4-turbo-preview'),
  tools: {
    ...trendTools,
  },
});

/**
 * Input schema for trend discovery operations
 */
export const trendDiscoveryInputSchema = z.object({
  sources: z.array(z.enum(['reddit', 'twitter', 'google_trends'])).optional(),
  minScore: z.number().min(0).max(100).default(70),
  limit: z.number().min(1).max(50).default(10),
  category: z.string().optional(),
});

export type TrendDiscoveryInput = z.infer<typeof trendDiscoveryInputSchema>;

/**
 * Output schema for trend discovery results
 */
export const trendDiscoveryOutputSchema = z.object({
  trends: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      hook: z.string(),
      source: z.string(),
      score: z.number(),
      category: z.string().nullable(),
      sentiment: z.string().nullable(),
      reasoning: z.string(),
      contentOpportunity: z.string(),
    })
  ),
  summary: z.object({
    totalTrends: z.number(),
    averageScore: z.number(),
    topCategories: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
});

export type TrendDiscoveryOutput = z.infer<typeof trendDiscoveryOutputSchema>;
