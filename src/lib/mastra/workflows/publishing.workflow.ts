import { z } from 'zod';
import { userSettingsRepository } from '@/lib/db/repositories';
import { executeWithTracking } from '../utils';

/**
 * Publishing Workflow
 *
 * Manages the post publishing process:
 * 1. Fetches approved posts ready for publishing
 * 2. Checks user preferences (auto-publish settings)
 * 3. Schedules or immediately publishes posts
 * 4. Updates post status and scheduled time
 * 5. Tracks publishing results
 *
 * Can be triggered manually or scheduled
 */

export const publishingInputSchema = z.object({
  userId: z.string(),
  postIds: z.array(z.string().uuid()).optional(),
  platform: z.enum(['twitter', 'linkedin', 'reddit']).optional(),
  scheduledTime: z.string().datetime().optional(),
  publishImmediately: z.boolean().default(false),
});

export type PublishingInput = z.infer<typeof publishingInputSchema>;

export const publishingOutputSchema = z.object({
  publishedPosts: z.number(),
  scheduledPosts: z.number(),
  failedPosts: z.number(),
  results: z.array(
    z.object({
      postId: z.string(),
      platform: z.string(),
      status: z.enum(['published', 'scheduled', 'failed']),
      publishedAt: z.string().datetime().optional(),
      scheduledFor: z.string().datetime().optional(),
      error: z.string().optional(),
    })
  ),
});

export type PublishingOutput = z.infer<typeof publishingOutputSchema>;

/**
 * Calculate next scheduled time based on platform
 */
function calculateNextScheduledTime(platform: string): string {
  const now = new Date();
  const scheduleMap: Record<string, number> = {
    twitter: 2,
    linkedin: 4,
    reddit: 6,
  };
  now.setHours(now.getHours() + (scheduleMap[platform] || 2));
  return now.toISOString();
}

/**
 * Execute the publishing workflow
 *
 * @param input - Workflow input parameters
 * @returns Workflow output with publishing results
 */
export async function runPublishingWorkflow(
  input: PublishingInput
): Promise<{ runId: string; output: PublishingOutput }> {
  const validatedInput = publishingInputSchema.parse(input);

  return executeWithTracking('publishing', validatedInput, async () => {
    // Step 1: Get user settings to check auto-publish preference
    const userSettings = await userSettingsRepository.findByUserId(validatedInput.userId);
    const shouldAutoPublish = validatedInput.publishImmediately || userSettings?.autoPublish || false;

    // Step 2: Get posts to publish (simulated for now)
    // In production, would fetch from database
    const posts = validatedInput.postIds?.map((id) => ({
      id,
      platform: validatedInput.platform || 'twitter',
      status: 'approved',
    })) || [];

    // Step 3: Process each post
    const results = [];
    let publishedCount = 0;
    let scheduledCount = 0;
    let failedCount = 0;

    for (const post of posts) {
      try {
        if (shouldAutoPublish) {
          // In production, would call platform APIs here
          results.push({
            postId: post.id,
            platform: post.platform,
            status: 'published' as const,
            publishedAt: new Date().toISOString(),
          });
          publishedCount++;
        } else {
          const scheduleTime = validatedInput.scheduledTime || calculateNextScheduledTime(post.platform);
          results.push({
            postId: post.id,
            platform: post.platform,
            status: 'scheduled' as const,
            scheduledFor: scheduleTime,
          });
          scheduledCount++;
        }
      } catch (error) {
        results.push({
          postId: post.id,
          platform: post.platform,
          status: 'failed' as const,
          error: error instanceof Error ? error.message : String(error),
        });
        failedCount++;
      }
    }

    return {
      publishedPosts: publishedCount,
      scheduledPosts: scheduledCount,
      failedPosts: failedCount,
      results,
    };
  });
}
