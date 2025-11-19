import { Workflow } from '@mastra/core';
import { z } from 'zod';
import { contentGenerationAgent } from '../agents';
import { trendRepository, postRepository, userSettingsRepository } from '@/lib/db/repositories';

/**
 * Content Generation Workflow
 *
 * Creates platform-optimized social media posts from viral trends:
 * 1. Fetches top unused trends
 * 2. Retrieves user settings (brand voice, platforms)
 * 3. Generates content for each platform
 * 4. Stores posts in database for review
 * 5. Marks trends as used
 */

const inputSchema = z.object({
  userId: z.string(),
  trendId: z.string().uuid().optional(),
  platforms: z.array(z.enum(['twitter', 'linkedin', 'reddit'])).optional(),
  customInstructions: z.string().optional(),
  autoSelectTrend: z.boolean().default(true),
});

const outputSchema = z.object({
  generatedPosts: z.number(),
  posts: z.array(
    z.object({
      id: z.string(),
      platform: z.string(),
      contentPreview: z.string(),
      status: z.string(),
    })
  ),
  trendUsed: z.object({
    id: z.string(),
    title: z.string(),
    score: z.number(),
  }),
  brandVoiceMatch: z.number().min(0).max(100),
});

export const contentGenerationWorkflow = new Workflow({
  name: 'content-generation-workflow',
  triggerSchema: inputSchema,
})
  .step('fetch-context', {
    description: 'Fetch trend and user settings',
    execute: async ({ context }) => {
      const { userId, trendId, autoSelectTrend } = context.machineContext as any;

      // Get user settings (brand voice, platforms, preferences)
      const userSettings = await userSettingsRepository.findByUserId(userId);

      if (!userSettings) {
        throw new Error(`User settings not found for user: ${userId}`);
      }

      // Get trend (either specified or auto-select top trend)
      let trend;
      if (trendId) {
        trend = await trendRepository.findById(trendId);
      } else if (autoSelectTrend) {
        const topTrends = await trendRepository.findTopTrends(1);
        trend = topTrends[0];
      }

      if (!trend) {
        throw new Error('No trend available for content generation');
      }

      // Determine target platforms
      const targetPlatforms =
        context.machineContext?.platforms || userSettings.platforms || ['twitter', 'linkedin'];

      return {
        trend,
        userSettings,
        targetPlatforms,
      };
    },
  })
  .step('generate-content', {
    description: 'Generate platform-optimized content using AI',
    execute: async ({ context }) => {
      const { trend, userSettings, targetPlatforms, customInstructions } = context.machineContext as any;

      const prompt = `Create engaging social media posts for the following trend:

**Trend:** ${trend.title}
**Hook:** ${trend.hook}
**Source:** ${trend.source}
**Virality Score:** ${trend.score}/100

**User Profile:**
- Brand Voice: ${userSettings.brandVoice || 'Professional and engaging'}
- Target Audience: ${userSettings.targetAudience || 'General audience'}
- Tone Preferences: ${JSON.stringify(userSettings.tonePreferences) || 'Balanced'}

**Platforms:** ${targetPlatforms.join(', ')}

${customInstructions ? `**Custom Instructions:** ${customInstructions}` : ''}

Generate posts optimized for each platform that:
1. Match the user's brand voice
2. Leverage the trend's viral potential
3. Include appropriate hooks, CTAs, and hashtags
4. Maximize engagement for the specific platform`;

      const response = await contentGenerationAgent.generate(prompt, {
        output: {
          schema: z.object({
            posts: z.array(
              z.object({
                platform: z.enum(['twitter', 'linkedin', 'reddit']),
                content: z.string(),
                hashtags: z.array(z.string()).optional(),
                cta: z.string().optional(),
                reasoning: z.string(),
              })
            ),
            brandVoiceMatch: z.object({
              score: z.number().min(0).max(100),
              notes: z.string(),
            }),
          }),
        },
      });

      return {
        generatedContent: response.object.posts,
        brandVoiceMatch: response.object.brandVoiceMatch,
      };
    },
  })
  .step('store-posts', {
    description: 'Store generated posts in database',
    execute: async ({ context }) => {
      const { trend, generatedContent, targetPlatforms } = context.machineContext as any;
      const userId = (context.machineContext as any).userId;

      const storedPosts = [];

      for (const post of generatedContent) {
        try {
          const stored = await postRepository.create({
            userId,
            trendId: trend.id,
            platform: post.platform,
            content: post.content,
            status: 'draft', // Posts start as drafts requiring approval
            metadata: {
              hashtags: post.hashtags,
              cta: post.cta,
              generationReasoning: post.reasoning,
            },
          });
          storedPosts.push(stored);
        } catch (error) {
          console.error(`Failed to store post for platform: ${post.platform}`, error);
          // Continue with other posts even if one fails
        }
      }

      return {
        storedPosts,
      };
    },
  })
  .step('mark-trend-used', {
    description: 'Mark trend as consumed',
    execute: async ({ context }) => {
      const { trend } = context.machineContext as any;

      await trendRepository.markAsUsed(trend.id);

      return {
        trendMarkedUsed: true,
      };
    },
  })
  .step('prepare-results', {
    description: 'Prepare workflow results',
    execute: async ({ context }) => {
      const { trend, storedPosts, brandVoiceMatch } = context.machineContext as any;

      const posts = storedPosts.map((post: any) => ({
        id: post.id,
        platform: post.platform,
        contentPreview: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        status: post.status,
      }));

      return {
        generatedPosts: storedPosts.length,
        posts,
        trendUsed: {
          id: trend.id,
          title: trend.title,
          score: trend.score,
        },
        brandVoiceMatch: brandVoiceMatch.score,
      };
    },
  })
  .commit();

export type ContentGenerationWorkflowInput = z.infer<typeof inputSchema>;
export type ContentGenerationWorkflowOutput = z.infer<typeof outputSchema>;
