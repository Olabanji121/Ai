import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { analyticsTools, postTools, userSettingsTools } from '../tools';

/**
 * Content Optimizer Agent
 *
 * Specialized agent for analyzing post performance and providing
 * actionable optimization recommendations.
 *
 * Uses OpenAI GPT-4 for analytical reasoning and data-driven insights.
 */

const systemPrompt = `You are an expert content optimization agent specialized in analyzing social media performance and providing data-driven recommendations.

Your responsibilities:
1. Analyze post performance metrics (engagement, reach, CTR)
2. Identify patterns in high-performing vs low-performing content
3. Provide specific, actionable optimization recommendations
4. Suggest improvements to content strategy
5. Recommend optimal posting times and formats

Analysis framework:
- Engagement metrics: likes, comments, shares, saves
- Reach and impressions
- Click-through rates on CTAs
- Audience response patterns
- Platform-specific performance factors

You have access to:
- getPostAnalytics: Retrieve performance data
- getLatestAnalytics: Get recent metrics
- getPlatformStats: Analyze platform-specific performance
- calculatePerformanceScore: Generate performance scores
- getUserSettings: Access user preferences

Provide concrete, specific recommendations backed by data insights.`;

/**
 * Content Optimizer Agent
 * Analyzes performance and suggests improvements
 */
export const contentOptimizerAgent = new Agent({
  name: 'content-optimizer-agent',
  instructions: systemPrompt,
  model: openai('gpt-4-turbo-preview'),
  tools: {
    ...analyticsTools,
    ...postTools,
    ...userSettingsTools,
  },
});

/**
 * Input schema for content optimization
 */
export const contentOptimizerInputSchema = z.object({
  userId: z.string(),
  postId: z.string().uuid().optional(),
  platform: z.enum(['twitter', 'linkedin', 'reddit']).optional(),
  timeRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .optional(),
  analysisType: z.enum(['single-post', 'platform-overview', 'trend-analysis']).default('platform-overview'),
});

export type ContentOptimizerInput = z.infer<typeof contentOptimizerInputSchema>;

/**
 * Output schema for optimization recommendations
 */
export const contentOptimizerOutputSchema = z.object({
  analysis: z.object({
    performanceScore: z.number().min(0).max(100),
    topPerformers: z.array(
      z.object({
        postId: z.string(),
        platform: z.string(),
        engagementRate: z.number(),
        keyFactors: z.array(z.string()),
      })
    ),
    underperformers: z.array(
      z.object({
        postId: z.string(),
        platform: z.string(),
        issues: z.array(z.string()),
      })
    ),
  }),
  insights: z.object({
    patterns: z.array(z.string()),
    bestPractices: z.array(z.string()),
    audiencePreferences: z.array(z.string()),
  }),
  recommendations: z.array(
    z.object({
      category: z.enum(['content', 'timing', 'format', 'engagement', 'strategy']),
      priority: z.enum(['high', 'medium', 'low']),
      action: z.string(),
      expectedImpact: z.string(),
      reasoning: z.string(),
    })
  ),
  nextSteps: z.array(z.string()),
});

export type ContentOptimizerOutput = z.infer<typeof contentOptimizerOutputSchema>;
