import { z } from 'zod';
import { createTool } from '@mastra/core';
import { trendRepository } from '@/lib/db/repositories';

/**
 * Trend Tools
 *
 * Tools for AI agents to interact with trend data via repository pattern.
 * All tools include input validation and error handling.
 */

/**
 * Get trends with optional filtering
 */
export const getTrends = createTool({
  id: 'get-trends',
  description: 'Retrieve trends from database with optional filtering by status, source, category, and score',
  inputSchema: z.object({
    status: z.enum(['new', 'completed', 'expired']).optional(),
    source: z.enum(['reddit', 'twitter', 'google_trends']).optional(),
    category: z.string().optional(),
    minScore: z.number().min(0).max(100).optional(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
  }),
  outputSchema: z.array(z.object({
    id: z.string(),
    title: z.string(),
    hook: z.string(),
    source: z.string(),
    score: z.number(),
    sentiment: z.string().nullable(),
    category: z.string().nullable(),
    usedForContent: z.boolean(),
    status: z.string().nullable(),
  })),
  execute: async ({ context }) => {
    try {
      const trends = await trendRepository.findAll({
        status: context.status,
        source: context.source,
        category: context.category,
        minScore: context.minScore,
        limit: context.limit,
        offset: context.offset,
      });
      return trends;
    } catch (error) {
      throw new Error(`Failed to get trends: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Get top scoring new trends
 */
export const getTopTrends = createTool({
  id: 'get-top-trends',
  description: 'Get the highest-scoring new trends for content generation',
  inputSchema: z.object({
    limit: z.number().min(1).max(100).default(10),
  }),
  outputSchema: z.array(z.object({
    id: z.string(),
    title: z.string(),
    hook: z.string(),
    source: z.string(),
    score: z.number(),
    category: z.string().nullable(),
  })),
  execute: async ({ context }) => {
    try {
      const trends = await trendRepository.findTopTrends(context.limit);
      return trends;
    } catch (error) {
      throw new Error(`Failed to get top trends: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Create a new trend
 */
export const createTrend = createTool({
  id: 'create-trend',
  description: 'Create a new trend record in the database',
  inputSchema: z.object({
    title: z.string().min(1),
    hook: z.string().min(1),
    source: z.enum(['reddit', 'twitter', 'google_trends']),
    sourceUrl: z.string().url().optional(),
    score: z.number().min(0).max(100),
    sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
    category: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
  outputSchema: z.object({
    id: z.string(),
    title: z.string(),
    score: z.number(),
    status: z.string().nullable(),
  }),
  execute: async ({ context }) => {
    try {
      const trend = await trendRepository.create({
        title: context.title,
        hook: context.hook,
        source: context.source,
        sourceUrl: context.sourceUrl,
        score: context.score,
        sentiment: context.sentiment,
        category: context.category,
        metadata: context.metadata,
      });
      return trend;
    } catch (error) {
      throw new Error(`Failed to create trend: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Mark a trend as used for content generation
 */
export const markTrendUsed = createTool({
  id: 'mark-trend-used',
  description: 'Mark a trend as used for content generation to prevent reuse',
  inputSchema: z.object({
    trendId: z.string().uuid(),
  }),
  outputSchema: z.object({
    id: z.string(),
    usedForContent: z.boolean(),
    status: z.string().nullable(),
  }),
  execute: async ({ context }) => {
    try {
      const trend = await trendRepository.markAsUsed(context.trendId);
      return {
        id: trend.id,
        usedForContent: trend.usedForContent,
        status: trend.status,
      };
    } catch (error) {
      throw new Error(`Failed to mark trend as used: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * All trend tools combined
 */
export const trendTools = {
  getTrends,
  getTopTrends,
  createTrend,
  markTrendUsed,
};
