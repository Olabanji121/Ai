import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import { db } from '../client';
import {
  posts,
  type Post,
  type NewPost,
  type UpdatePost,
  type PostFilters,
  type PostWithTrend,
} from '../schema/posts';
import { trends } from '../schema/trends';
import { BaseRepository, applyPagination } from './base.repository';
import { QueryError } from '../errors';

/**
 * Post Repository
 *
 * Handles all database operations for posts.
 * Supports filtering, joining with trends, and status management.
 */
class PostRepository implements BaseRepository<Post, NewPost, UpdatePost, PostFilters> {
  /**
   * Create a new post
   */
  async create(data: NewPost): Promise<Post> {
    try {
      const [post] = await db.insert(posts).values(data).returning();
      return post;
    } catch (error) {
      throw new QueryError(
        'Failed to create post',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find a post by ID
   */
  async findById(id: string): Promise<Post | null> {
    try {
      const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
      return post || null;
    } catch (error) {
      throw new QueryError(
        `Failed to find post with ID: ${id}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find a post with its associated trend
   */
  async findByIdWithTrend(id: string): Promise<PostWithTrend | null> {
    try {
      const [result] = await db
        .select()
        .from(posts)
        .leftJoin(trends, eq(posts.trendId, trends.id))
        .where(eq(posts.id, id))
        .limit(1);

      if (!result) {
        return null;
      }

      return {
        ...result.posts,
        trend: result.trends,
      };
    } catch (error) {
      throw new QueryError(
        `Failed to find post with trend for ID: ${id}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find all posts matching the given filters
   */
  async findAll(filters?: PostFilters): Promise<Post[]> {
    try {
      // Build WHERE conditions
      const conditions: any[] = [];

      if (filters?.status) {
        conditions.push(eq(posts.status, filters.status));
      }

      if (filters?.platform) {
        conditions.push(eq(posts.platform, filters.platform));
      }

      if (filters?.trendId) {
        conditions.push(eq(posts.trendId, filters.trendId));
      }

      if (filters?.createdBy) {
        conditions.push(eq(posts.createdBy, filters.createdBy));
      }

      if (filters?.scheduledFrom) {
        conditions.push(gte(posts.scheduledFor, filters.scheduledFrom));
      }

      if (filters?.scheduledTo) {
        conditions.push(lte(posts.scheduledFor, filters.scheduledTo));
      }

      // Apply pagination
      const { limit, offset } = applyPagination(filters);

      // Build and execute query
      let query = db.select().from(posts);

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);

      return results;
    } catch (error) {
      throw new QueryError(
        'Failed to find posts',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find all posts with their associated trends
   */
  async findAllWithTrends(filters?: PostFilters): Promise<PostWithTrend[]> {
    try {
      // Build WHERE conditions
      const conditions: any[] = [];

      if (filters?.status) {
        conditions.push(eq(posts.status, filters.status));
      }

      if (filters?.platform) {
        conditions.push(eq(posts.platform, filters.platform));
      }

      if (filters?.trendId) {
        conditions.push(eq(posts.trendId, filters.trendId));
      }

      if (filters?.createdBy) {
        conditions.push(eq(posts.createdBy, filters.createdBy));
      }

      if (filters?.scheduledFrom) {
        conditions.push(gte(posts.scheduledFor, filters.scheduledFrom));
      }

      if (filters?.scheduledTo) {
        conditions.push(lte(posts.scheduledFor, filters.scheduledTo));
      }

      // Apply pagination
      const { limit, offset } = applyPagination(filters);

      // Build query with join
      let query = db
        .select()
        .from(posts)
        .leftJoin(trends, eq(posts.trendId, trends.id));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);

      return results.map((result) => ({
        ...result.posts,
        trend: result.trends,
      }));
    } catch (error) {
      throw new QueryError(
        'Failed to find posts with trends',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update a post by ID
   */
  async update(id: string, data: UpdatePost): Promise<Post> {
    try {
      const [updated] = await db
        .update(posts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(posts.id, id))
        .returning();

      if (!updated) {
        throw new Error(`Post with ID ${id} not found`);
      }

      return updated;
    } catch (error) {
      throw new QueryError(
        `Failed to update post with ID: ${id}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Delete a post by ID
   */
  async delete(id: string): Promise<void> {
    try {
      await db.delete(posts).where(eq(posts.id, id));
    } catch (error) {
      throw new QueryError(
        `Failed to delete post with ID: ${id}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Count posts matching the given filters
   */
  async count(filters?: PostFilters): Promise<number> {
    try {
      // Build WHERE conditions (same as findAll)
      const conditions: any[] = [];

      if (filters?.status) {
        conditions.push(eq(posts.status, filters.status));
      }

      if (filters?.platform) {
        conditions.push(eq(posts.platform, filters.platform));
      }

      if (filters?.trendId) {
        conditions.push(eq(posts.trendId, filters.trendId));
      }

      if (filters?.createdBy) {
        conditions.push(eq(posts.createdBy, filters.createdBy));
      }

      // Build query
      let query = db.select({ count: count() }).from(posts);

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const [result] = await query;
      return result?.count || 0;
    } catch (error) {
      throw new QueryError(
        'Failed to count posts',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find posts pending review
   */
  async findPendingReview(limit: number = 50): Promise<PostWithTrend[]> {
    return this.findAllWithTrends({
      status: 'pending_review',
      limit: Math.min(limit, 100),
    });
  }

  /**
   * Find posts scheduled for publishing
   */
  async findScheduled(beforeDate?: Date): Promise<PostWithTrend[]> {
    const filters: PostFilters = {
      status: 'approved',
    };

    if (beforeDate) {
      filters.scheduledTo = beforeDate;
    }

    return this.findAllWithTrends(filters);
  }

  /**
   * Approve a post for publishing
   */
  async approve(id: string, reviewedBy: string, scheduledFor?: Date): Promise<Post> {
    return this.update(id, {
      status: 'approved',
      reviewedBy,
      reviewedAt: new Date(),
      scheduledFor,
    });
  }

  /**
   * Reject a post
   */
  async reject(id: string, reviewedBy: string, reason: string): Promise<Post> {
    return this.update(id, {
      status: 'rejected',
      reviewedBy,
      reviewedAt: new Date(),
      failureReason: reason,
    });
  }

  /**
   * Mark a post as published
   */
  async markPublished(id: string, externalPostId: string): Promise<Post> {
    return this.update(id, {
      status: 'published',
      publishedAt: new Date(),
      externalPostId,
    });
  }

  /**
   * Mark a post as failed
   */
  async markFailed(id: string, reason: string): Promise<Post> {
    return this.update(id, {
      status: 'failed',
      failureReason: reason,
    });
  }
}

// Export singleton instance
export const postRepository = new PostRepository();
