import { eq, and, gte, lte, desc, count, sql } from 'drizzle-orm';
import { db } from '../client';
import {
  analytics,
  type Analytics,
  type NewAnalytics,
  type AnalyticsFilters,
  type AnalyticsWithMetrics,
} from '../schema/analytics';
import { QueryError } from '../errors';
import { applyPagination } from './base.repository';

/**
 * Analytics Repository
 *
 * Handles all database operations for post analytics.
 * Supports aggregations and metric calculations.
 */
class AnalyticsRepository {
  /**
   * Create new analytics record
   */
  async create(data: NewAnalytics): Promise<Analytics> {
    try {
      // Calculate derived metrics
      const ctr = data.impressions && data.impressions > 0
        ? (data.clicks || 0) / data.impressions * 100
        : 0;

      const engagementRate = data.impressions && data.impressions > 0
        ? ((data.likes || 0) + (data.comments || 0) + (data.shares || 0)) / data.impressions * 100
        : 0;

      const [record] = await db.insert(analytics).values({
        ...data,
        ctr,
        engagementRate,
      }).returning();

      return record;
    } catch (error) {
      throw new QueryError(
        'Failed to create analytics record',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find analytics by post ID
   */
  async findByPostId(postId: string): Promise<Analytics[]> {
    try {
      return await db
        .select()
        .from(analytics)
        .where(eq(analytics.postId, postId))
        .orderBy(desc(analytics.fetchedAt));
    } catch (error) {
      throw new QueryError(
        `Failed to find analytics for post ID: ${postId}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find latest analytics for a post
   */
  async findLatestByPostId(postId: string): Promise<Analytics | null> {
    try {
      const [record] = await db
        .select()
        .from(analytics)
        .where(eq(analytics.postId, postId))
        .orderBy(desc(analytics.fetchedAt))
        .limit(1);

      return record || null;
    } catch (error) {
      throw new QueryError(
        `Failed to find latest analytics for post ID: ${postId}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find analytics within a date range
   */
  async findByDateRange(fromDate: Date, toDate: Date, filters?: AnalyticsFilters): Promise<Analytics[]> {
    try {
      const conditions: any[] = [
        gte(analytics.fetchedAt, fromDate),
        lte(analytics.fetchedAt, toDate),
      ];

      if (filters?.postId) {
        conditions.push(eq(analytics.postId, filters.postId));
      }

      if (filters?.platform) {
        conditions.push(eq(analytics.platform, filters.platform));
      }

      const { limit, offset } = applyPagination(filters);

      return await db
        .select()
        .from(analytics)
        .where(and(...conditions))
        .orderBy(desc(analytics.fetchedAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      throw new QueryError(
        'Failed to find analytics by date range',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get aggregate analytics for a platform
   */
  async getAggregateByPlatform(platform: string, fromDate?: Date, toDate?: Date): Promise<{
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalImpressions: number;
    totalClicks: number;
    avgEngagementRate: number;
    avgCtr: number;
  }> {
    try {
      const conditions: any[] = [eq(analytics.platform, platform)];

      if (fromDate) {
        conditions.push(gte(analytics.fetchedAt, fromDate));
      }

      if (toDate) {
        conditions.push(lte(analytics.fetchedAt, toDate));
      }

      const [result] = await db
        .select({
          totalPosts: count(),
          totalLikes: sql<number>`COALESCE(SUM(${analytics.likes}), 0)`,
          totalComments: sql<number>`COALESCE(SUM(${analytics.comments}), 0)`,
          totalShares: sql<number>`COALESCE(SUM(${analytics.shares}), 0)`,
          totalImpressions: sql<number>`COALESCE(SUM(${analytics.impressions}), 0)`,
          totalClicks: sql<number>`COALESCE(SUM(${analytics.clicks}), 0)`,
          avgEngagementRate: sql<number>`COALESCE(AVG(${analytics.engagementRate}), 0)`,
          avgCtr: sql<number>`COALESCE(AVG(${analytics.ctr}), 0)`,
        })
        .from(analytics)
        .where(and(...conditions));

      return {
        totalPosts: Number(result?.totalPosts || 0),
        totalLikes: Number(result?.totalLikes || 0),
        totalComments: Number(result?.totalComments || 0),
        totalShares: Number(result?.totalShares || 0),
        totalImpressions: Number(result?.totalImpressions || 0),
        totalClicks: Number(result?.totalClicks || 0),
        avgEngagementRate: Number(result?.avgEngagementRate || 0),
        avgCtr: Number(result?.avgCtr || 0),
      };
    } catch (error) {
      throw new QueryError(
        `Failed to get aggregate analytics for platform: ${platform}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get top performing posts by engagement rate
   */
  async getTopPerformingPosts(limit: number = 10, platform?: string): Promise<Analytics[]> {
    try {
      let query = db
        .select()
        .from(analytics)
        .orderBy(desc(analytics.engagementRate));

      if (platform) {
        query = query.where(eq(analytics.platform, platform)) as any;
      }

      return await query.limit(Math.min(limit, 100));
    } catch (error) {
      throw new QueryError(
        'Failed to get top performing posts',
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Calculate performance score for analytics record
   */
  calculatePerformanceScore(record: Analytics): number {
    // Weighted scoring algorithm
    let score = 0;

    // Engagement rate: 40 points max
    score += Math.min((record.engagementRate || 0) * 10, 40);

    // CTR: 30 points max
    score += Math.min((record.ctr || 0) * 5, 30);

    // Shares: 20 points max (viral potential)
    score += Math.min((record.shares || 0) / 10, 20);

    // Comments: 10 points max (discussion quality)
    score += Math.min((record.comments || 0) / 5, 10);

    return Math.round(Math.min(score, 100));
  }

  /**
   * Get analytics with calculated metrics
   */
  async findByPostIdWithMetrics(postId: string): Promise<AnalyticsWithMetrics[]> {
    try {
      const records = await this.findByPostId(postId);

      return records.map(record => ({
        ...record,
        totalEngagement: (record.likes || 0) + (record.comments || 0) + (record.shares || 0),
        performanceScore: this.calculatePerformanceScore(record),
      }));
    } catch (error) {
      throw new QueryError(
        `Failed to find analytics with metrics for post ID: ${postId}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Delete analytics by post ID
   */
  async deleteByPostId(postId: string): Promise<void> {
    try {
      await db.delete(analytics).where(eq(analytics.postId, postId));
    } catch (error) {
      throw new QueryError(
        `Failed to delete analytics for post ID: ${postId}`,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

// Export singleton instance
export const analyticsRepository = new AnalyticsRepository();
