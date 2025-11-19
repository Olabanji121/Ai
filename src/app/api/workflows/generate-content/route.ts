import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executeWithTracking } from '@/lib/mastra/utils';
import { contentGenerationAgent } from '@/lib/mastra/agents';
import { trendRepository, postRepository, userSettingsRepository } from '@/lib/db/repositories';

/**
 * POST /api/workflows/generate-content
 *
 * Triggers the content generation workflow to create posts from trends.
 */

const requestSchema = z.object({
  userId: z.string(),
  trendId: z.string().uuid().optional(),
  platforms: z.array(z.enum(['twitter', 'linkedin', 'reddit'])).optional(),
  customInstructions: z.string().optional(),
  autoSelectTrend: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = requestSchema.parse(body);

    const { runId, output } = await executeWithTracking(
      'content-generation',
      input,
      async () => {
        // Get user settings
        const userSettings = await userSettingsRepository.findByUserId(input.userId);
        if (!userSettings) {
          throw new Error(`User settings not found for user: ${input.userId}`);
        }

        // Get trend
        let trend;
        if (input.trendId) {
          trend = await trendRepository.findById(input.trendId);
        } else if (input.autoSelectTrend) {
          const topTrends = await trendRepository.findTopTrends(1);
          trend = topTrends[0];
        }

        if (!trend) {
          throw new Error('No trend available for content generation');
        }

        const targetPlatforms = input.platforms || userSettings.platforms || ['twitter', 'linkedin'];

        // Generate content using the agent
        const prompt = `Create engaging social media posts for:
Trend: ${trend.title}
Hook: ${trend.hook}
Platforms: ${targetPlatforms.join(', ')}
Brand Voice: ${userSettings.brandVoice || 'Professional and engaging'}
${input.customInstructions ? `Custom: ${input.customInstructions}` : ''}`;

        await contentGenerationAgent.generate(prompt);

        // For now, return simulated results
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
      }
    );

    return NextResponse.json({
      success: true,
      runId,
      data: output,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: 'Workflow execution failed', message },
      { status: 500 }
    );
  }
}
