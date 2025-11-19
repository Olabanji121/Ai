import { Workflow } from '@mastra/core';
import { z } from 'zod';
import { postRepository, userSettingsRepository } from '@/lib/db/repositories';

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

const inputSchema = z.object({
  userId: z.string(),
  postIds: z.array(z.string().uuid()).optional(),
  platform: z.enum(['twitter', 'linkedin', 'reddit']).optional(),
  scheduledTime: z.string().datetime().optional(),
  publishImmediately: z.boolean().default(false),
});

const outputSchema = z.object({
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

export const publishingWorkflow = new Workflow({
  name: 'publishing-workflow',
  triggerSchema: inputSchema,
})
  .step('fetch-posts', {
    description: 'Fetch approved posts ready for publishing',
    execute: async ({ context }) => {
      const { userId, postIds, platform } = context.machineContext as any;

      let posts;

      if (postIds && postIds.length > 0) {
        // Fetch specific posts by IDs
        posts = await Promise.all(postIds.map((id: string) => postRepository.findById(id)));
        posts = posts.filter((p) => p !== null);
      } else {
        // Fetch all approved posts for the user (optionally filtered by platform)
        posts = await postRepository.findByUserId(userId);
        posts = posts.filter((p: any) => p.status === 'approved');

        if (platform) {
          posts = posts.filter((p: any) => p.platform === platform);
        }
      }

      if (posts.length === 0) {
        throw new Error('No approved posts available for publishing');
      }

      return {
        postsToPublish: posts,
      };
    },
  })
  .step('check-user-settings', {
    description: 'Check user auto-publish preferences',
    execute: async ({ context }) => {
      const { userId, publishImmediately } = context.machineContext as any;

      const userSettings = await userSettingsRepository.findByUserId(userId);

      const shouldAutoPublish = publishImmediately || userSettings?.autoPublish || false;
      const postingSchedule = userSettings?.postingSchedule || {};

      return {
        shouldAutoPublish,
        postingSchedule,
      };
    },
  })
  .step('publish-or-schedule', {
    description: 'Publish posts or schedule for later',
    execute: async ({ context }) => {
      const { postsToPublish, shouldAutoPublish, scheduledTime } = context.machineContext as any;

      const results = [];
      let publishedCount = 0;
      let scheduledCount = 0;
      let failedCount = 0;

      for (const post of postsToPublish) {
        try {
          if (shouldAutoPublish) {
            // In a real implementation, this would call platform APIs
            // (Twitter API, LinkedIn API, Reddit API)
            // For now, we'll simulate publishing by updating status

            await postRepository.updateStatus(post.id, 'published');

            results.push({
              postId: post.id,
              platform: post.platform,
              status: 'published' as const,
              publishedAt: new Date().toISOString(),
            });

            publishedCount++;
          } else {
            // Schedule for later
            const scheduleTime = scheduledTime || calculateNextScheduledTime(post.platform);

            await postRepository.updateStatus(post.id, 'scheduled');

            results.push({
              postId: post.id,
              platform: post.platform,
              status: 'scheduled' as const,
              scheduledFor: scheduleTime,
            });

            scheduledCount++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.push({
            postId: post.id,
            platform: post.platform,
            status: 'failed' as const,
            error: errorMessage,
          });

          failedCount++;
        }
      }

      return {
        results,
        publishedCount,
        scheduledCount,
        failedCount,
      };
    },
  })
  .step('prepare-results', {
    description: 'Prepare workflow results',
    execute: async ({ context }) => {
      const { results, publishedCount, scheduledCount, failedCount } = context.machineContext as any;

      return {
        publishedPosts: publishedCount,
        scheduledPosts: scheduledCount,
        failedPosts: failedCount,
        results,
      };
    },
  })
  .commit();

/**
 * Calculate next scheduled time based on platform and posting schedule
 * This is a placeholder - real implementation would use user's posting schedule
 */
function calculateNextScheduledTime(platform: string): string {
  const now = new Date();
  const scheduleMap: Record<string, number> = {
    twitter: 2, // 2 hours from now
    linkedin: 4, // 4 hours from now
    reddit: 6, // 6 hours from now
  };

  const hoursToAdd = scheduleMap[platform] || 2;
  now.setHours(now.getHours() + hoursToAdd);

  return now.toISOString();
}

export type PublishingWorkflowInput = z.infer<typeof inputSchema>;
export type PublishingWorkflowOutput = z.infer<typeof outputSchema>;
