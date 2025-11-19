import { z } from 'zod';
import { createTool } from '@mastra/core';
import { analyticsRepository } from '@/lib/db/repositories';

/**
 * Analytics Tools
 *
 * Tools for AI agents to access and analyze post performance metrics.
 */

/**
 * Get analytics for a specific post
 */
export const getPostAnalytics = createTool({
  id: 'get-post-analytics',
  description: 'Get all analytics records for a specific post',
  inputSchema: z.object({
    postId: z.string().uuid(),
  }),
  outputSchema: z.array(z.object({
    id: z.string(),
    likes: z.number().nullable(),
    comments: z.number().nullable(),
    shares: z.number().nullable(),
    impressions: z.number().nullable(),
    clicks: z.number().nullable(),
    ctr: z.number().nullable(),
    engagementRate: z.number().nullable(),
  })),
  execute: async ({ context }) => {
    try {
      const analytics = await analyticsRepository.findByPostId(context.postId);
      return analytics;
    } catch (error) {
      throw new Error(`Failed to get post analytics: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Get latest analytics for a post
 */
export const getLatestAnalytics = createTool({
  id: 'get-latest-analytics',
  description: 'Get the most recent analytics data for a post',
  inputSchema: z.object({
    postId: z.string().uuid(),
  }),
  outputSchema: z.object({
    likes: z.number().nullable(),
    comments: z.number().nullable(),
    shares: z.number().nullable(),
    impressions: z.number().nullable(),
    clicks: z.number().nullable(),
    ctr: z.number().nullable(),
    engagementRate: z.number().nullable(),
  }).nullable(),
  execute: async ({ context }) => {
    try {
      const analytics = await analyticsRepository.findLatestByPostId(context.postId);
      return analytics;
    } catch (error) {
      throw new Error(`Failed to get latest analytics: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Get aggregated platform statistics
 */
export const getPlatformStats = createTool({
  id: 'get-platform-stats',
  description: 'Get aggregated performance statistics for a platform',
  inputSchema: z.object({
    platform: z.enum(['twitter', 'linkedin', 'reddit']),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
  }),
  outputSchema: z.object({
    totalPosts: z.number(),
    totalLikes: z.number(),
    totalComments: z.number(),
    totalShares: z.number(),
    totalImpressions: z.number(),
    totalClicks: z.number(),
    avgEngagementRate: z.number(),
    avgCtr: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const fromDate = context.fromDate ? new Date(context.fromDate) : undefined;
      const toDate = context.toDate ? new Date(context.toDate) : undefined;

      const stats = await analyticsRepository.getAggregateByPlatform(
        context.platform,
        fromDate,
        toDate
      );
      return stats;
    } catch (error) {
      throw new Error(`Failed to get platform stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Calculate performance score for analytics
 */
export const calculatePerformanceScore = createTool({
  id: 'calculate-performance-score',
  description: 'Calculate a 0-100 performance score based on engagement metrics',
  inputSchema: z.object({
    engagementRate: z.number().min(0).optional(),
    ctr: z.number().min(0).optional(),
    shares: z.number().int().min(0).optional(),
    comments: z.number().int().min(0).optional(),
  }),
  outputSchema: z.object({
    score: z.number().min(0).max(100),
  }),
  execute: async ({ context }) => {
    try {
      // Use the repository's calculation method
      const mockAnalytics = {
        engagementRate: context.engagementRate || 0,
        ctr: context.ctr || 0,
        shares: context.shares || 0,
        comments: context.comments || 0,
      } as any;

      const score = analyticsRepository.calculatePerformanceScore(mockAnalytics);
      return { score };
    } catch (error) {
      throw new Error(`Failed to calculate performance score: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * All analytics tools combined
 */
export const analyticsTools = {
  getPostAnalytics,
  getLatestAnalytics,
  getPlatformStats,
  calculatePerformanceScore,
};
