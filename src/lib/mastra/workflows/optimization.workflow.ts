import { Workflow } from '@mastra/core';
import { z } from 'zod';
import { contentOptimizerAgent } from '../agents';
import { postRepository, analyticsRepository } from '@/lib/db/repositories';

/**
 * Optimization Workflow
 *
 * Analyzes post performance and provides optimization recommendations:
 * 1. Fetches published posts and their analytics
 * 2. Analyzes performance metrics using AI
 * 3. Identifies patterns and best practices
 * 4. Generates actionable recommendations
 * 5. Stores insights for future content strategy
 *
 * Runs daily or can be triggered manually
 */

const inputSchema = z.object({
  userId: z.string(),
  platform: z.enum(['twitter', 'linkedin', 'reddit']).optional(),
  timeRange: z
    .object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    })
    .optional(),
  minPostsRequired: z.number().min(1).default(5),
  analysisType: z.enum(['single-post', 'platform-overview', 'trend-analysis']).default('platform-overview'),
  postId: z.string().uuid().optional(),
});

const outputSchema = z.object({
  performanceScore: z.number().min(0).max(100),
  postsAnalyzed: z.number(),
  insights: z.object({
    topPerformers: z.array(
      z.object({
        postId: z.string(),
        platform: z.string(),
        engagementRate: z.number(),
      })
    ),
    underperformers: z.array(
      z.object({
        postId: z.string(),
        platform: z.string(),
        issues: z.array(z.string()),
      })
    ),
    patterns: z.array(z.string()),
  }),
  recommendations: z.array(
    z.object({
      category: z.string(),
      priority: z.string(),
      action: z.string(),
      expectedImpact: z.string(),
    })
  ),
  nextSteps: z.array(z.string()),
});

export const optimizationWorkflow = new Workflow({
  name: 'optimization-workflow',
  triggerSchema: inputSchema,
})
  .step('fetch-performance-data', {
    description: 'Fetch posts and their analytics data',
    execute: async ({ context }) => {
      const { userId, platform, timeRange, postId, minPostsRequired } = context.machineContext as any;

      let posts;

      if (postId) {
        // Analyze single post
        const post = await postRepository.findById(postId);
        posts = post ? [post] : [];
      } else {
        // Fetch all published posts for the user
        posts = await postRepository.findByUserId(userId);
        posts = posts.filter((p: any) => p.status === 'published');

        // Filter by platform if specified
        if (platform) {
          posts = posts.filter((p: any) => p.platform === platform);
        }

        // Filter by time range if specified
        if (timeRange) {
          const startDate = new Date(timeRange.start);
          const endDate = new Date(timeRange.end);
          posts = posts.filter((p: any) => {
            const publishedAt = new Date(p.publishedAt || p.createdAt);
            return publishedAt >= startDate && publishedAt <= endDate;
          });
        }
      }

      if (posts.length < minPostsRequired) {
        throw new Error(
          `Insufficient posts for analysis. Found ${posts.length}, require at least ${minPostsRequired}`
        );
      }

      // Fetch analytics for each post
      const postsWithAnalytics = await Promise.all(
        posts.map(async (post: any) => {
          const analytics = await analyticsRepository.findByPostId(post.id);
          return {
            ...post,
            analytics: analytics || null,
          };
        })
      );

      return {
        postsWithAnalytics,
        postsCount: posts.length,
      };
    },
  })
  .step('analyze-performance', {
    description: 'Analyze performance using AI',
    execute: async ({ context }) => {
      const { postsWithAnalytics, analysisType } = context.machineContext as any;

      // Prepare data summary for the AI agent
      const performanceSummary = postsWithAnalytics.map((post: any) => ({
        postId: post.id,
        platform: post.platform,
        content: post.content.substring(0, 200), // First 200 chars
        publishedAt: post.publishedAt,
        analytics: post.analytics
          ? {
              impressions: post.analytics.impressions,
              engagements: post.analytics.engagements,
              likes: post.analytics.likes,
              comments: post.analytics.comments,
              shares: post.analytics.shares,
              clicks: post.analytics.clicks,
              engagementRate: post.analytics.engagementRate,
            }
          : null,
      }));

      const prompt = `Analyze the performance of the following social media posts:

**Analysis Type:** ${analysisType}
**Posts Analyzed:** ${postsWithAnalytics.length}

**Performance Data:**
${JSON.stringify(performanceSummary, null, 2)}

Provide:
1. Overall performance score (0-100)
2. Top 3 performing posts and key success factors
3. Bottom 3 posts and what went wrong
4. Patterns and trends in the data
5. Actionable recommendations prioritized by impact
6. Best practices for future content
7. Specific next steps to improve performance`;

      const response = await contentOptimizerAgent.generate(prompt, {
        output: {
          schema: z.object({
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
          }),
        },
      });

      return {
        analysisResults: response.object,
      };
    },
  })
  .step('prepare-results', {
    description: 'Prepare optimization results',
    execute: async ({ context }) => {
      const { postsCount, analysisResults } = context.machineContext as any;

      return {
        performanceScore: analysisResults.analysis.performanceScore,
        postsAnalyzed: postsCount,
        insights: {
          topPerformers: analysisResults.analysis.topPerformers,
          underperformers: analysisResults.analysis.underperformers,
          patterns: analysisResults.insights.patterns,
        },
        recommendations: analysisResults.recommendations.map((rec: any) => ({
          category: rec.category,
          priority: rec.priority,
          action: rec.action,
          expectedImpact: rec.expectedImpact,
        })),
        nextSteps: analysisResults.nextSteps,
      };
    },
  })
  .commit();

export type OptimizationWorkflowInput = z.infer<typeof inputSchema>;
export type OptimizationWorkflowOutput = z.infer<typeof outputSchema>;
