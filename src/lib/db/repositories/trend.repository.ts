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
 * Handles all database operations for trends.
 * Implements the repository pattern for type-safe, testable data access.
 */
class TrendRepository implements BaseRepository<Trend, NewTrend, UpdateTrend, TrendFilters> {
  /**
   * Create a new trend
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
   * Find a trend by ID
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
   * Find all trends matching the given filters
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
   * Find top trending topics by score
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
   */
  async markAsUsed(id: string): Promise<Trend> {
    return this.update(id, { usedForContent: true, status: 'completed' });
  }
}

// Export singleton instance
export const trendRepository = new TrendRepository();
