import { z } from 'zod';
import { createTool } from '@mastra/core';
import { postRepository } from '@/lib/db/repositories';

/**
 * Post Tools
 *
 * Tools for AI agents to interact with post data and manage post lifecycle.
 */

/**
 * Create a new post
 */
export const createPost = createTool({
  id: 'create-post',
  description: 'Create a new social media post',
  inputSchema: z.object({
    trendId: z.string().uuid().optional(),
    platform: z.enum(['twitter', 'linkedin', 'reddit']),
    content: z.string().min(1),
    mediaUrls: z.array(z.string().url()).optional(),
    hashtags: z.array(z.string()).optional(),
    tone: z.string().optional(),
    status: z.enum(['draft', 'approved', 'rejected', 'published', 'failed']).default('draft'),
  }),
  outputSchema: z.object({
    id: z.string(),
    platform: z.string(),
    content: z.string(),
    status: z.string().nullable(),
  }),
  execute: async ({ context }) => {
    try {
      const post = await postRepository.create({
        trendId: context.trendId,
        platform: context.platform,
        content: context.content,
        mediaUrls: context.mediaUrls,
        hashtags: context.hashtags,
        tone: context.tone,
        status: context.status,
      });
      return post;
    } catch (error) {
      throw new Error(`Failed to create post: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Get post by ID
 */
export const getPost = createTool({
  id: 'get-post',
  description: 'Retrieve a post by its ID',
  inputSchema: z.object({
    postId: z.string().uuid(),
  }),
  outputSchema: z.object({
    id: z.string(),
    platform: z.string(),
    content: z.string(),
    status: z.string().nullable(),
    trendId: z.string().nullable(),
  }).nullable(),
  execute: async ({ context }) => {
    try {
      const post = await postRepository.findById(context.postId);
      return post;
    } catch (error) {
      throw new Error(`Failed to get post: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Get post with associated trend
 */
export const getPostWithTrend = createTool({
  id: 'get-post-with-trend',
  description: 'Retrieve a post along with its associated trend data',
  inputSchema: z.object({
    postId: z.string().uuid(),
  }),
  outputSchema: z.object({
    post: z.object({
      id: z.string(),
      platform: z.string(),
      content: z.string(),
    }),
    trend: z.object({
      title: z.string(),
      hook: z.string(),
      score: z.number(),
    }).nullable(),
  }).nullable(),
  execute: async ({ context }) => {
    try {
      const result = await postRepository.findByIdWithTrend(context.postId);
      if (!result) return null;

      return {
        post: {
          id: result.id,
          platform: result.platform,
          content: result.content,
        },
        trend: result.trend ? {
          title: result.trend.title,
          hook: result.trend.hook,
          score: result.trend.score,
        } : null,
      };
    } catch (error) {
      throw new Error(`Failed to get post with trend: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Approve a post for publishing
 */
export const approvePost = createTool({
  id: 'approve-post',
  description: 'Approve a post and optionally schedule it for publishing',
  inputSchema: z.object({
    postId: z.string().uuid(),
    reviewedBy: z.string(),
    scheduledFor: z.string().datetime().optional(),
  }),
  outputSchema: z.object({
    id: z.string(),
    status: z.string().nullable(),
    scheduledFor: z.string().nullable(),
  }),
  execute: async ({ context }) => {
    try {
      const scheduledDate = context.scheduledFor ? new Date(context.scheduledFor) : undefined;
      const post = await postRepository.approve(
        context.postId,
        context.reviewedBy,
        scheduledDate
      );
      return {
        id: post.id,
        status: post.status,
        scheduledFor: post.scheduledFor?.toISOString() || null,
      };
    } catch (error) {
      throw new Error(`Failed to approve post: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Mark post as published
 */
export const publishPost = createTool({
  id: 'publish-post',
  description: 'Mark a post as published with external platform ID',
  inputSchema: z.object({
    postId: z.string().uuid(),
    externalPostId: z.string(),
  }),
  outputSchema: z.object({
    id: z.string(),
    status: z.string().nullable(),
    externalPostId: z.string().nullable(),
  }),
  execute: async ({ context }) => {
    try {
      const post = await postRepository.markPublished(
        context.postId,
        context.externalPostId
      );
      return {
        id: post.id,
        status: post.status,
        externalPostId: post.externalPostId,
      };
    } catch (error) {
      throw new Error(`Failed to publish post: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * Get posts by platform
 */
export const getPostsByPlatform = createTool({
  id: 'get-posts-by-platform',
  description: 'Get all posts for a specific platform',
  inputSchema: z.object({
    platform: z.enum(['twitter', 'linkedin', 'reddit']),
    status: z.enum(['draft', 'approved', 'rejected', 'published', 'failed']).optional(),
    limit: z.number().min(1).max(100).default(50),
  }),
  outputSchema: z.array(z.object({
    id: z.string(),
    content: z.string(),
    status: z.string().nullable(),
  })),
  execute: async ({ context }) => {
    try {
      const posts = await postRepository.findAll({
        platform: context.platform,
        status: context.status,
        limit: context.limit,
      });
      return posts;
    } catch (error) {
      throw new Error(`Failed to get posts by platform: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

/**
 * All post tools combined
 */
export const postTools = {
  createPost,
  getPost,
  getPostWithTrend,
  approvePost,
  publishPost,
  getPostsByPlatform,
};
