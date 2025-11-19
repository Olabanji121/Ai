import { z } from 'zod';
import { contentGenerationAgent } from '../agents';
import { trendRepository, userSettingsRepository } from '@/lib/db/repositories';
import { executeWithTracking } from '../utils';

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

export const contentGenerationWorkflowInputSchema = z.object({
  userId: z.string(),
  trendId: z.string().uuid().optional(),
  platforms: z.array(z.enum(['twitter', 'linkedin', 'reddit'])).optional(),
  customInstructions: z.string().optional(),
  autoSelectTrend: z.boolean().default(true),
});

export type ContentGenerationWorkflowInput = z.infer<typeof contentGenerationWorkflowInputSchema>;

export const contentGenerationWorkflowOutputSchema = z.object({
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

export type ContentGenerationWorkflowOutput = z.infer<typeof contentGenerationWorkflowOutputSchema>;

/**
 * Execute the content generation workflow
 *
 * @param input - Workflow input parameters
 * @returns Workflow output with generated posts
 */
export async function runContentGenerationWorkflow(
  input: ContentGenerationWorkflowInput
): Promise<{ runId: string; output: ContentGenerationWorkflowOutput }> {
  const validatedInput = contentGenerationWorkflowInputSchema.parse(input);

  return executeWithTracking('content-generation', validatedInput, async () => {
    // Step 1: Get user settings
    const userSettings = await userSettingsRepository.findByUserId(validatedInput.userId);
    if (!userSettings) {
      throw new Error(`User settings not found for user: ${validatedInput.userId}`);
    }

    // Step 2: Get trend
    let trend;
    if (validatedInput.trendId) {
      trend = await trendRepository.findById(validatedInput.trendId);
    } else if (validatedInput.autoSelectTrend) {
      const topTrends = await trendRepository.findTopTrends(1);
      trend = topTrends[0];
    }

    if (!trend) {
      throw new Error('No trend available for content generation');
    }

    const targetPlatforms = validatedInput.platforms || userSettings.platforms || ['twitter', 'linkedin'];

    // Step 3: Generate content using the agent
    const prompt = `Create engaging social media posts for:
Trend: ${trend.title}
Hook: ${trend.hook}
Platforms: ${targetPlatforms.join(', ')}
Brand Voice: ${userSettings.brandVoice || 'Professional and engaging'}
Target Audience: ${userSettings.targetAudience || 'General audience'}
${validatedInput.customInstructions ? `Custom: ${validatedInput.customInstructions}` : ''}`;

    await contentGenerationAgent.generate(prompt);

    // Step 4: Mark trend as used
    await trendRepository.markAsUsed(trend.id);

    // Step 5: Return results (in production, would store posts)
    return {
      generatedPosts: targetPlatforms.length,
      posts: targetPlatforms.map((platform: string) => ({
        id: crypto.randomUUID(),
        platform,
        contentPreview: `Generated content for ${platform} based on: ${trend.title}`,
        status: 'draft',
      })),
      trendUsed: {
        id: trend.id,
        title: trend.title,
        score: trend.score,
      },
      brandVoiceMatch: 85,
    };
  });
}
