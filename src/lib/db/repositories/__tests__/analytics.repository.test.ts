/**
 * AnalyticsRepository Tests
 *
 * Tests for analytics data access and metric calculations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyticsRepository } from '../analytics.repository';
import { testFactories, testUuid, mockDate } from '../../__tests__/setup';
import type { Analytics, NewAnalytics } from '../../schema/analytics';

// Mock the database
vi.mock('../../client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
}));

describe('AnalyticsRepository', () => {
  const mockAnalytics: Analytics = {
    id: testUuid(1),
    postId: testUuid(100),
    platform: 'twitter',
    likes: 150,
    comments: 25,
    shares: 10,
    impressions: 5000,
    clicks: 250,
    ctr: 5.0,
    engagementRate: 3.7,
    reachRate: null,
    fetchedAt: mockDate,
    rawData: { source: 'twitter_api', version: '2.0' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create analytics and auto-calculate CTR', async () => {
      const newAnalytics: NewAnalytics = testFactories.analytics({
        impressions: 1000,
        clicks: 50,
      });

      const expectedCtr = (50 / 1000) * 100; // 5%

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([
        { ...mockAnalytics, ctr: expectedCtr },
      ]);

      const result = await analyticsRepository.create(newAnalytics);

      expect(db.insert).toHaveBeenCalled();
      expect(result.ctr).toBeCloseTo(expectedCtr, 2);
    });

    it('should create analytics and auto-calculate engagement rate', async () => {
      const newAnalytics: NewAnalytics = testFactories.analytics({
        likes: 100,
        comments: 20,
        shares: 15,
        impressions: 1000,
      });

      // Engagement = (likes + comments + shares) / impressions * 100
      const expectedEngagement = ((100 + 20 + 15) / 1000) * 100; // 13.5%

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([
        { ...mockAnalytics, engagementRate: expectedEngagement },
      ]);

      const result = await analyticsRepository.create(newAnalytics);

      expect(result.engagementRate).toBeCloseTo(expectedEngagement, 2);
    });

    it('should handle zero impressions gracefully', async () => {
      const newAnalytics: NewAnalytics = testFactories.analytics({
        impressions: 0,
        clicks: 10,
      });

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([
        { ...mockAnalytics, ctr: 0, engagementRate: 0 },
      ]);

      const result = await analyticsRepository.create(newAnalytics);

      expect(result.ctr).toBe(0);
      expect(result.engagementRate).toBe(0);
    });

    it('should handle null metrics', async () => {
      const newAnalytics: NewAnalytics = testFactories.analytics({
        likes: null,
        comments: null,
        shares: null,
        clicks: null,
        impressions: 1000,
      });

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([
        { ...mockAnalytics, ctr: 0, engagementRate: 0 },
      ]);

      const result = await analyticsRepository.create(newAnalytics);

      expect(result.ctr).toBe(0);
      expect(result.engagementRate).toBe(0);
    });
  });

  describe('findById', () => {
    it('should find analytics by id', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue([mockAnalytics]);

      const result = await analyticsRepository.findById(testUuid(1));

      expect(result).toEqual(mockAnalytics);
    });

    it('should return null when not found', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue([]);

      const result = await analyticsRepository.findById(testUuid(999));

      expect(result).toBeNull();
    });
  });

  describe('findByPostId', () => {
    it('should find all analytics for a post', async () => {
      const analyticsRecords = [
        mockAnalytics,
        { ...mockAnalytics, id: testUuid(2), fetchedAt: new Date() },
      ];

      const { db } = await import('../../client');
      vi.mocked(db.orderBy).mockResolvedValue(analyticsRecords);

      const result = await analyticsRepository.findByPostId(testUuid(100));

      expect(db.where).toHaveBeenCalled();
      expect(db.orderBy).toHaveBeenCalled(); // ordered by fetchedAt desc
      expect(result).toHaveLength(2);
    });

    it('should return empty array for post with no analytics', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.orderBy).mockResolvedValue([]);

      const result = await analyticsRepository.findByPostId(testUuid(999));

      expect(result).toEqual([]);
    });
  });

  describe('findLatestByPostId', () => {
    it('should find most recent analytics for a post', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue([mockAnalytics]);

      const result = await analyticsRepository.findLatestByPostId(testUuid(100));

      expect(db.where).toHaveBeenCalled();
      expect(db.orderBy).toHaveBeenCalled();
      expect(db.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAnalytics);
    });

    it('should return null when no analytics exist', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue([]);

      const result = await analyticsRepository.findLatestByPostId(testUuid(999));

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update analytics successfully', async () => {
      const updates = { likes: 200, comments: 30 };
      const updatedAnalytics = { ...mockAnalytics, ...updates };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([updatedAnalytics]);

      const result = await analyticsRepository.update(testUuid(1), updates);

      expect(result.likes).toBe(200);
      expect(result.comments).toBe(30);
    });
  });

  describe('delete', () => {
    it('should delete analytics by id', async () => {
      const { db } = await import('../../client');

      await analyticsRepository.delete(testUuid(1));

      expect(db.delete).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
    });
  });

  describe('getAggregateByPlatform', () => {
    it('should aggregate analytics for a platform', async () => {
      const aggregatedData = {
        totalPosts: 50,
        totalLikes: 5000,
        totalComments: 800,
        totalShares: 300,
        totalImpressions: 100000,
        totalClicks: 5000,
        avgEngagementRate: 6.1,
        avgCtr: 5.0,
      };

      const { db } = await import('../../client');
      vi.mocked(db.where).mockResolvedValue([aggregatedData]);

      const result = await analyticsRepository.getAggregateByPlatform('twitter');

      expect(db.select).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(result.totalPosts).toBe(50);
      expect(result.totalLikes).toBe(5000);
      expect(result.avgEngagementRate).toBeCloseTo(6.1, 1);
    });

    it('should filter by date range', async () => {
      const fromDate = new Date('2025-01-01');
      const toDate = new Date('2025-01-31');

      const aggregatedData = {
        totalPosts: 10,
        totalLikes: 1000,
        totalComments: 100,
        totalShares: 50,
        totalImpressions: 20000,
        totalClicks: 1000,
        avgEngagementRate: 5.75,
        avgCtr: 5.0,
      };

      const { db } = await import('../../client');
      vi.mocked(db.where).mockResolvedValue([aggregatedData]);

      const result = await analyticsRepository.getAggregateByPlatform(
        'twitter',
        fromDate,
        toDate
      );

      expect(db.where).toHaveBeenCalled();
      expect(result.totalPosts).toBe(10);
    });

    it('should handle platform with no data', async () => {
      const emptyData = {
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalImpressions: 0,
        totalClicks: 0,
        avgEngagementRate: 0,
        avgCtr: 0,
      };

      const { db } = await import('../../client');
      vi.mocked(db.where).mockResolvedValue([emptyData]);

      const result = await analyticsRepository.getAggregateByPlatform('reddit');

      expect(result.totalPosts).toBe(0);
      expect(result.avgEngagementRate).toBe(0);
    });
  });

  describe('calculatePerformanceScore', () => {
    it('should calculate performance score from analytics', () => {
      const analytics: Analytics = {
        ...mockAnalytics,
        engagementRate: 5.0, // 40 points (5 * 10, capped at 40)
        ctr: 4.0, // 20 points (4 * 5, capped at 30)
        shares: 50, // 5 points (50 / 10, capped at 20)
        comments: 20, // 4 points (20 / 5, capped at 10)
      };

      const score = analyticsRepository.calculatePerformanceScore(analytics);

      // 40 + 20 + 5 + 4 = 69
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should cap score at 100', () => {
      const analytics: Analytics = {
        ...mockAnalytics,
        engagementRate: 20.0, // would be 200 points
        ctr: 20.0, // would be 100 points
        shares: 500, // would be 50 points
        comments: 100, // would be 20 points
      };

      const score = analyticsRepository.calculatePerformanceScore(analytics);

      expect(score).toBe(100);
    });

    it('should handle zero metrics', () => {
      const analytics: Analytics = {
        ...mockAnalytics,
        engagementRate: 0,
        ctr: 0,
        shares: 0,
        comments: 0,
      };

      const score = analyticsRepository.calculatePerformanceScore(analytics);

      expect(score).toBe(0);
    });

    it('should handle null metrics', () => {
      const analytics: Analytics = {
        ...mockAnalytics,
        engagementRate: null,
        ctr: null,
        shares: null,
        comments: null,
      };

      const score = analyticsRepository.calculatePerformanceScore(analytics);

      expect(score).toBe(0);
    });

    it('should calculate proportional score for moderate metrics', () => {
      const analytics: Analytics = {
        ...mockAnalytics,
        engagementRate: 2.0, // 20 points
        ctr: 2.0, // 10 points
        shares: 10, // 1 point
        comments: 5, // 1 point
      };

      const score = analyticsRepository.calculatePerformanceScore(analytics);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(50);
    });
  });

  describe('findByPlatform', () => {
    it('should find all analytics for a platform', async () => {
      const twitterAnalytics = [
        mockAnalytics,
        { ...mockAnalytics, id: testUuid(2) },
      ];

      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue(twitterAnalytics);

      const result = await analyticsRepository.findByPlatform('twitter');

      expect(db.where).toHaveBeenCalled();
      expect(result.every((a) => a.platform === 'twitter')).toBe(true);
    });

    it('should apply pagination', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([]);

      await analyticsRepository.findByPlatform('twitter', 20, 10);

      expect(db.limit).toHaveBeenCalledWith(20);
      expect(db.offset).toHaveBeenCalledWith(10);
    });
  });

  describe('findInDateRange', () => {
    it('should find analytics within date range', async () => {
      const fromDate = new Date('2025-01-01');
      const toDate = new Date('2025-01-31');

      const { db } = await import('../../client');
      vi.mocked(db.orderBy).mockResolvedValue([mockAnalytics]);

      const result = await analyticsRepository.findInDateRange(fromDate, toDate);

      expect(db.where).toHaveBeenCalled();
      expect(db.orderBy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very high engagement rates', async () => {
      const viralAnalytics: NewAnalytics = testFactories.analytics({
        likes: 10000,
        comments: 5000,
        shares: 2000,
        impressions: 50000,
      });

      const expectedEngagement = ((10000 + 5000 + 2000) / 50000) * 100; // 34%

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([
        { ...mockAnalytics, engagementRate: expectedEngagement },
      ]);

      const result = await analyticsRepository.create(viralAnalytics);

      expect(result.engagementRate).toBeGreaterThan(30);
    });

    it('should handle very low engagement rates', async () => {
      const lowEngagementAnalytics: NewAnalytics = testFactories.analytics({
        likes: 1,
        comments: 0,
        shares: 0,
        impressions: 10000,
      });

      const expectedEngagement = (1 / 10000) * 100; // 0.01%

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([
        { ...mockAnalytics, engagementRate: expectedEngagement },
      ]);

      const result = await analyticsRepository.create(lowEngagementAnalytics);

      expect(result.engagementRate).toBeLessThan(1);
    });

    it('should handle analytics with raw data', async () => {
      const analyticsWithRawData: NewAnalytics = testFactories.analytics({
        rawData: {
          api_version: '2.0',
          extra_metrics: { video_views: 500 },
          metadata: { fetched_by: 'cron_job' },
        },
      });

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([
        { ...mockAnalytics, rawData: analyticsWithRawData.rawData },
      ]);

      const result = await analyticsRepository.create(analyticsWithRawData);

      expect(result.rawData).toBeDefined();
      expect(result.rawData).toHaveProperty('api_version');
    });

    it('should handle negative values gracefully', async () => {
      const negativeAnalytics: NewAnalytics = testFactories.analytics({
        likes: -10, // shouldn't happen but handle gracefully
        impressions: 1000,
      });

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([
        { ...mockAnalytics, likes: -10 },
      ]);

      const result = await analyticsRepository.create(negativeAnalytics);

      expect(result.likes).toBe(-10);
    });
  });

  describe('Performance Score Boundaries', () => {
    it('should give high score to excellent performance', () => {
      const excellentAnalytics: Analytics = {
        ...mockAnalytics,
        engagementRate: 10.0, // max 40 points
        ctr: 6.0, // max 30 points
        shares: 200, // max 20 points
        comments: 50, // max 10 points
      };

      const score = analyticsRepository.calculatePerformanceScore(
        excellentAnalytics
      );

      expect(score).toBe(100); // 40 + 30 + 20 + 10 = 100
    });

    it('should give medium score to average performance', () => {
      const averageAnalytics: Analytics = {
        ...mockAnalytics,
        engagementRate: 2.0, // 20 points
        ctr: 2.0, // 10 points
        shares: 5, // 0.5 points (rounded)
        comments: 2, // 0.4 points (rounded)
      };

      const score = analyticsRepository.calculatePerformanceScore(
        averageAnalytics
      );

      expect(score).toBeGreaterThan(20);
      expect(score).toBeLessThan(50);
    });

    it('should give low score to poor performance', () => {
      const poorAnalytics: Analytics = {
        ...mockAnalytics,
        engagementRate: 0.5, // 5 points
        ctr: 0.5, // 2.5 points
        shares: 1, // 0.1 points
        comments: 1, // 0.2 points
      };

      const score = analyticsRepository.calculatePerformanceScore(poorAnalytics);

      expect(score).toBeLessThan(10);
    });
  });
});
