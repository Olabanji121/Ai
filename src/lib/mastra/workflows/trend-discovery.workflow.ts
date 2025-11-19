import { Workflow, Step } from '@mastra/core';
import { z } from 'zod';
import { trendDiscoveryAgent } from '../agents';
import { trendRepository } from '@/lib/db/repositories';

/**
 * Trend Discovery Workflow
 *
 * Scheduled workflow that:
 * 1. Analyzes trends from multiple sources
 * 2. Scores trends based on virality potential
 * 3. Stores high-scoring trends in database
 * 4. Provides content creation recommendations
 *
 * Runs every 6 hours (configurable)
 */

const inputSchema = z.object({
  sources: z.array(z.enum(['reddit', 'twitter', 'google_trends'])).default(['reddit', 'twitter', 'google_trends']),
  minScore: z.number().min(0).max(100).default(70),
  maxTrends: z.number().min(1).max(100).default(20),
  categories: z.array(z.string()).optional(),
});

const outputSchema = z.object({
  processedTrends: z.number(),
  storedTrends: z.number(),
  topTrends: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      score: z.number(),
      source: z.string(),
    })
  ),
  recommendations: z.array(z.string()),
  executionTime: z.number(),
});

export const trendDiscoveryWorkflow = new Workflow({
  name: 'trend-discovery-workflow',
  triggerSchema: inputSchema,
})
  .step('analyze-trends', {
    description: 'Discover and analyze viral trends from multiple sources',
    execute: async ({ context, mastra }) => {
      const startTime = Date.now();

      // In a real implementation, this would call external APIs (Reddit, Twitter, Google Trends)
      // For now, we'll simulate the agent analyzing existing trends

      const prompt = `Analyze current trends from the following sources: ${context.machineContext?.sources.join(', ')}.

Focus on:
- Viral content with high engagement
- Recent trends (last 24-48 hours)
- Content creation opportunities
- Minimum virality score: ${context.machineContext?.minScore}

Identify the top ${context.machineContext?.maxTrends} trends and provide:
1. Trend scoring and ranking
2. Content hooks and angles
3. Platform-specific recommendations
4. Sentiment and category analysis`;

      // Use the trend discovery agent
      const response = await trendDiscoveryAgent.generate(prompt, {
        output: {
          schema: z.object({
            trends: z.array(
              z.object({
                title: z.string(),
                hook: z.string(),
                source: z.enum(['reddit', 'twitter', 'google_trends']),
                sourceUrl: z.string().url().optional(),
                score: z.number().min(0).max(100),
                sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
                category: z.string().optional(),
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
          }),
        },
      });

      const result = response.object;

      return {
        analyzedTrends: result.trends,
        summary: result.summary,
        executionTime: Date.now() - startTime,
      };
    },
  })
  .step('store-trends', {
    description: 'Store high-scoring trends in database',
    execute: async ({ context }) => {
      const { analyzedTrends } = context.machineContext as any;
      const storedTrends = [];

      // Store each trend in the database
      for (const trend of analyzedTrends) {
        try {
          const stored = await trendRepository.create({
            title: trend.title,
            hook: trend.hook,
            source: trend.source,
            sourceUrl: trend.sourceUrl,
            score: trend.score,
            sentiment: trend.sentiment,
            category: trend.category,
            metadata: {
              reasoning: trend.reasoning,
              contentOpportunity: trend.contentOpportunity,
            },
          });
          storedTrends.push(stored);
        } catch (error) {
          console.error(`Failed to store trend: ${trend.title}`, error);
          // Continue with other trends even if one fails
        }
      }

      return {
        storedTrends,
        storedCount: storedTrends.length,
      };
    },
  })
  .step('prepare-results', {
    description: 'Prepare workflow results and recommendations',
    execute: async ({ context }) => {
      const { analyzedTrends, summary, executionTime, storedTrends, storedCount } = context.machineContext as any;

      const topTrends = storedTrends.slice(0, 5).map((trend: any) => ({
        id: trend.id,
        title: trend.title,
        score: trend.score,
        source: trend.source,
      }));

      return {
        processedTrends: analyzedTrends.length,
        storedTrends: storedCount,
        topTrends,
        recommendations: summary.recommendations,
        executionTime,
      };
    },
  })
  .commit();

export type TrendDiscoveryWorkflowInput = z.infer<typeof inputSchema>;
export type TrendDiscoveryWorkflowOutput = z.infer<typeof outputSchema>;
