import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executeWithTracking } from '@/lib/mastra/utils';
import { postRepository, userSettingsRepository } from '@/lib/db/repositories';

/**
 * POST /api/workflows/publish
 *
 * Triggers the publishing workflow to publish or schedule posts.
 */

const requestSchema = z.object({
  userId: z.string(),
  postIds: z.array(z.string().uuid()).optional(),
  platform: z.enum(['twitter', 'linkedin', 'reddit']).optional(),
  scheduledTime: z.string().datetime().optional(),
  publishImmediately: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = requestSchema.parse(body);

    const { runId, output } = await executeWithTracking(
      'publishing',
      input,
      async () => {
        // Get user settings to check auto-publish preference
        const userSettings = await userSettingsRepository.findByUserId(input.userId);
        const shouldAutoPublish = input.publishImmediately || userSettings?.autoPublish || false;

        // For now, return simulated results
        // In production, this would fetch posts and publish them
        const results = [
          {
            postId: input.postIds?.[0] || crypto.randomUUID(),
            platform: input.platform || 'twitter',
            status: shouldAutoPublish ? 'published' : 'scheduled',
            publishedAt: shouldAutoPublish ? new Date().toISOString() : undefined,
            scheduledFor: !shouldAutoPublish ? (input.scheduledTime || new Date(Date.now() + 3600000).toISOString()) : undefined,
          },
        ];

        return {
          publishedPosts: shouldAutoPublish ? results.length : 0,
          scheduledPosts: shouldAutoPublish ? 0 : results.length,
          failedPosts: 0,
          results,
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
