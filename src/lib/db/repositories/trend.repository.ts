import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import { db } from '../client';
import {
  trends,
  type Trend,
  type NewTrend,
  type UpdateTrend,
  type TrendFilters,
} from '../schema/trends';
import { BaseRepository, applyPagination } from './base.repository';
import { QueryError } from '../errors';

/**
 * Trend Repository
 *
 * Handles all database operations for trends discovered from various sources
 * (Reddit, Twitter, Google Trends). Implements the repository pattern for
 * type-safe, testable data access with full CRUD operations and specialized queries.
 *
 * @example
 * ```typescript
 * import { trendRepository } from '@/lib/db/repositories';
 *
 * // Create a new trend
 * const trend = await trendRepository.create({
 *   title: 'AI Revolution in Marketing',
 *   hook: 'How AI is transforming digital marketing',
 *   source: 'reddit',
 *   score: 92.5,
 * });
 *
 * // Find top trends
 * const topTrends = await trendRepository.findTopTrends(10);
 * ```
 */
class TrendRepository implements BaseRepository<Trend, NewTrend, UpdateTrend, TrendFilters> {
  /**
   * Create a new trend record in the database
   *
   * @param data - Trend data to insert. Must include title, hook, source, and score.
   * @returns Promise resolving to the created trend with generated ID and timestamps
   * @throws {QueryError} If the database operation fails
   *
   * @example
   * ```typescript
   * const trend = await trendRepository.create({
   *   title: 'AI Breakthrough',
   *   hook: 'New AI model achieves human-level performance',
   *   source: 'twitter',
   *   sourceUrl: 'https://twitter.com/example/status/123',
   *   score: 85.0,
   *   sentiment: 'positive',
   *   category: 'technology',
   * });
   * ```
   */
  async create(data: NewTrend): Promise<Trend> {
    try {
      const [trend] = await db.insert(trends).values(data).returning();
      return trend;
    } catch (error) {
      throw new QueryError(
        'Failed to create trend',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find a single trend by its unique identifier
   *
   * @param id - UUID of the trend to find
   * @returns Promise resolving to the trend if found, null otherwise
   * @throws {QueryError} If the database query fails
   *
   * @example
   * ```typescript
   * const trend = await trendRepository.findById('550e8400-e29b-41d4-a716-446655440000');
   * if (trend) {
   *   console.log(`Found trend: ${trend.title}`);
   * }
   * ```
   */
  async findById(id: string): Promise<Trend | null> {
    try {
      const [trend] = await db.select().from(trends).where(eq(trends.id, id)).limit(1);
      return trend || null;
    } catch (error) {
      throw new QueryError(
        `Failed to find trend with ID: ${id}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find all trends matching the specified filters with pagination
   *
   * Results are ordered by score (highest first) by default.
   * Supports filtering by status, source, category, score range, and usage status.
   *
   * @param filters - Optional filtering and pagination options
   * @param filters.status - Filter by status ('new', 'completed', 'expired')
   * @param filters.source - Filter by source platform ('reddit', 'twitter', 'google_trends')
   * @param filters.category - Filter by category
   * @param filters.minScore - Minimum virality score (0-100)
   * @param filters.maxScore - Maximum virality score (0-100)
   * @param filters.usedForContent - Filter by whether trend was used for content
   * @param filters.limit - Maximum results to return (default: 50, max: 100)
   * @param filters.offset - Number of results to skip for pagination
   * @returns Promise resolving to array of matching trends
   * @throws {QueryError} If the database query fails
   *
   * @example
   * ```typescript
   * // Find new trends from Reddit with high scores
   * const trends = await trendRepository.findAll({
   *   status: 'new',
   *   source: 'reddit',
   *   minScore: 80,
   *   limit: 20,
   * });
   *
   * // Find unused trends for content generation
   * const unused = await trendRepository.findAll({
   *   usedForContent: false,
   *   status: 'new',
   * });
   * ```
   */
  async findAll(filters?: TrendFilters): Promise<Trend[]> {
    try {
      // Build WHERE conditions
      const conditions: any[] = [];

      if (filters?.status) {
        conditions.push(eq(trends.status, filters.status));
      }

      if (filters?.source) {
        conditions.push(eq(trends.source, filters.source));
      }

      if (filters?.category) {
        conditions.push(eq(trends.category, filters.category));
      }

      if (filters?.minScore !== undefined) {
        conditions.push(gte(trends.score, filters.minScore));
      }

      if (filters?.maxScore !== undefined) {
        conditions.push(lte(trends.score, filters.maxScore));
      }

      if (filters?.usedForContent !== undefined) {
        conditions.push(eq(trends.usedForContent, filters.usedForContent));
      }

      // Apply pagination
      const { limit, offset } = applyPagination(filters);

      // Build and execute query
      let query = db.select().from(trends);

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query
        .orderBy(desc(trends.score)) // Default: highest score first
        .limit(limit)
        .offset(offset);

      return results;
    } catch (error) {
      throw new QueryError(
        'Failed to find trends',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update a trend by ID
   */
  async update(id: string, data: UpdateTrend): Promise<Trend> {
    try {
      const [updated] = await db
        .update(trends)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(trends.id, id))
        .returning();

      if (!updated) {
        throw new Error(`Trend with ID ${id} not found`);
      }

      return updated;
    } catch (error) {
      throw new QueryError(
        `Failed to update trend with ID: ${id}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Delete a trend by ID
   */
  async delete(id: string): Promise<void> {
    try {
      await db.delete(trends).where(eq(trends.id, id));
    } catch (error) {
      throw new QueryError(
        `Failed to delete trend with ID: ${id}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Count trends matching the given filters
   */
  async count(filters?: TrendFilters): Promise<number> {
    try {
      // Build WHERE conditions (same as findAll)
      const conditions: any[] = [];

      if (filters?.status) {
        conditions.push(eq(trends.status, filters.status));
      }

      if (filters?.source) {
        conditions.push(eq(trends.source, filters.source));
      }

      if (filters?.category) {
        conditions.push(eq(trends.category, filters.category));
      }

      if (filters?.minScore !== undefined) {
        conditions.push(gte(trends.score, filters.minScore));
      }

      if (filters?.maxScore !== undefined) {
        conditions.push(lte(trends.score, filters.maxScore));
      }

      if (filters?.usedForContent !== undefined) {
        conditions.push(eq(trends.usedForContent, filters.usedForContent));
      }

      // Build query
      let query = db.select({ count: count() }).from(trends);

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const [result] = await query;
      return result?.count || 0;
    } catch (error) {
      throw new QueryError(
        'Failed to count trends',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find the highest-scoring new trends
   *
   * Returns trends with status='new' ordered by score (highest first).
   * Useful for identifying the most viral content to create posts from.
   *
   * @param limit - Maximum number of trends to return (default: 10, max: 100)
   * @returns Promise resolving to array of top-scoring trends
   * @throws {QueryError} If the database query fails
   *
   * @example
   * ```typescript
   * // Get top 5 trends for content generation
   * const topTrends = await trendRepository.findTopTrends(5);
   * for (const trend of topTrends) {
   *   console.log(`${trend.title} - Score: ${trend.score}`);
   * }
   * ```
   */
  async findTopTrends(limit: number = 10): Promise<Trend[]> {
    try {
      return await db
        .select()
        .from(trends)
        .where(eq(trends.status, 'new'))
        .orderBy(desc(trends.score))
        .limit(Math.min(limit, 100));
    } catch (error) {
      throw new QueryError(
        'Failed to find top trends',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Mark a trend as used for content generation
   *
   * Updates the trend's status to 'completed' and sets usedForContent to true.
   * This prevents the same trend from being used multiple times.
   *
   * @param id - UUID of the trend to mark as used
   * @returns Promise resolving to the updated trend
   * @throws {QueryError} If the database operation fails
   *
   * @example
   * ```typescript
   * // After creating a post from a trend
   * const trend = await trendRepository.findTopTrends(1);
   * await postRepository.create({ trendId: trend[0].id, ... });
   * await trendRepository.markAsUsed(trend[0].id);
   * ```
   */
  async markAsUsed(id: string): Promise<Trend> {
    return this.update(id, { usedForContent: true, status: 'completed' });
  }
}

// Export singleton instance
export const trendRepository = new TrendRepository();
