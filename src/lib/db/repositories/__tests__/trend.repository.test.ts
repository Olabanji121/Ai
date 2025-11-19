/**
 * TrendRepository Tests
 *
 * Comprehensive tests for trend data access operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trendRepository } from '../trend.repository';
import { testFactories, testUuid, mockDate } from '../../__tests__/setup';
import type { Trend, NewTrend, TrendFilters } from '../../schema/trends';

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

describe('TrendRepository', () => {
  const mockTrend: Trend = {
    id: testUuid(1),
    title: 'AI Revolution in Marketing',
    hook: 'How AI is transforming digital marketing in 2025',
    source: 'reddit',
    sourceUrl: 'https://reddit.com/r/marketing/post123',
    score: 92.5,
    sentiment: 'positive',
    category: 'technology',
    metadata: {
      subreddit: 'marketing',
      upvotes: 2500,
      comments: 150,
    },
    status: 'new',
    usedForContent: false,
    embedding: null,
    discoveredAt: mockDate,
    expiresAt: null,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new trend successfully', async () => {
      const newTrend: NewTrend = testFactories.trend({
        title: 'New Trend Title',
        score: 85.0,
      });

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([mockTrend]);

      const result = await trendRepository.create(newTrend);

      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(newTrend);
      expect(db.returning).toHaveBeenCalled();
      expect(result).toEqual(mockTrend);
    });

    it('should create trend with minimal required fields', async () => {
      const minimalTrend: NewTrend = {
        title: 'Minimal Trend',
        hook: 'Short hook',
        source: 'twitter',
        score: 50.0,
      };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([
        { ...mockTrend, ...minimalTrend },
      ]);

      const result = await trendRepository.create(minimalTrend);

      expect(result.title).toBe(minimalTrend.title);
      expect(result.hook).toBe(minimalTrend.hook);
      expect(result.source).toBe(minimalTrend.source);
      expect(result.score).toBe(minimalTrend.score);
    });
  });

  describe('findById', () => {
    it('should find trend by id', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue([mockTrend]);

      const result = await trendRepository.findById(testUuid(1));

      expect(db.select).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(db.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTrend);
    });

    it('should return null when trend not found', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue([]);

      const result = await trendRepository.findById(testUuid(999));

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    const mockTrends: Trend[] = [
      mockTrend,
      {
        ...mockTrend,
        id: testUuid(2),
        title: 'Another Trend',
        score: 88.0,
      },
    ];

    it('should return all trends without filters', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue(mockTrends);

      const result = await trendRepository.findAll();

      expect(db.select).toHaveBeenCalled();
      expect(db.orderBy).toHaveBeenCalled();
      expect(result).toEqual(mockTrends);
    });

    it('should filter by status', async () => {
      const filters: TrendFilters = { status: 'new' };
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([mockTrend]);

      const result = await trendRepository.findAll(filters);

      expect(db.where).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should filter by source', async () => {
      const filters: TrendFilters = { source: 'reddit' };
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([mockTrend]);

      const result = await trendRepository.findAll(filters);

      expect(db.where).toHaveBeenCalled();
      expect(result[0].source).toBe('reddit');
    });

    it('should filter by category', async () => {
      const filters: TrendFilters = { category: 'technology' };
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([mockTrend]);

      const result = await trendRepository.findAll(filters);

      expect(result[0].category).toBe('technology');
    });

    it('should filter by minimum score', async () => {
      const filters: TrendFilters = { minScore: 90 };
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([mockTrend]);

      const result = await trendRepository.findAll(filters);

      expect(result[0].score).toBeGreaterThanOrEqual(90);
    });

    it('should filter by date range', async () => {
      const filters: TrendFilters = {
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-01-31'),
      };
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([mockTrend]);

      await trendRepository.findAll(filters);

      expect(db.where).toHaveBeenCalled();
    });

    it('should apply pagination with default limit', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue(mockTrends);

      await trendRepository.findAll();

      expect(db.limit).toHaveBeenCalledWith(50); // default limit
      expect(db.offset).toHaveBeenCalledWith(0); // default offset
    });

    it('should apply custom pagination', async () => {
      const filters: TrendFilters = { limit: 20, offset: 10 };
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([]);

      await trendRepository.findAll(filters);

      expect(db.limit).toHaveBeenCalledWith(20);
      expect(db.offset).toHaveBeenCalledWith(10);
    });

    it('should enforce maximum limit of 100', async () => {
      const filters: TrendFilters = { limit: 200 };
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([]);

      await trendRepository.findAll(filters);

      expect(db.limit).toHaveBeenCalledWith(100); // max limit
    });

    it('should combine multiple filters', async () => {
      const filters: TrendFilters = {
        status: 'new',
        source: 'reddit',
        minScore: 80,
        category: 'technology',
      };
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([mockTrend]);

      const result = await trendRepository.findAll(filters);

      expect(db.where).toHaveBeenCalled();
      expect(result[0].status).toBe('new');
      expect(result[0].source).toBe('reddit');
      expect(result[0].category).toBe('technology');
    });
  });

  describe('update', () => {
    it('should update trend successfully', async () => {
      const updates = { status: 'completed' as const, score: 95.0 };
      const updatedTrend = { ...mockTrend, ...updates };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([updatedTrend]);

      const result = await trendRepository.update(testUuid(1), updates);

      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith(updates);
      expect(db.where).toHaveBeenCalled();
      expect(result.status).toBe('completed');
      expect(result.score).toBe(95.0);
    });

    it('should update only specified fields', async () => {
      const updates = { sentiment: 'neutral' as const };
      const updatedTrend = { ...mockTrend, ...updates };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([updatedTrend]);

      const result = await trendRepository.update(testUuid(1), updates);

      expect(result.sentiment).toBe('neutral');
      expect(result.title).toBe(mockTrend.title); // unchanged
    });
  });

  describe('delete', () => {
    it('should delete trend by id', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.where).mockResolvedValue(undefined);

      await trendRepository.delete(testUuid(1));

      expect(db.delete).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
    });
  });

  describe('count', () => {
    it('should count all trends without filters', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.from).mockResolvedValue([{ count: 150 }]);

      const result = await trendRepository.count();

      expect(db.select).toHaveBeenCalled();
      expect(result).toBe(150);
    });

    it('should count trends with filters', async () => {
      const filters: TrendFilters = { status: 'new' };
      const { db } = await import('../../client');
      vi.mocked(db.from).mockResolvedValue([{ count: 25 }]);

      const result = await trendRepository.count(filters);

      expect(db.where).toHaveBeenCalled();
      expect(result).toBe(25);
    });
  });

  describe('findTopTrends', () => {
    it('should return top trends by score', async () => {
      const topTrends = [
        { ...mockTrend, score: 98.0 },
        { ...mockTrend, id: testUuid(2), score: 95.0 },
        { ...mockTrend, id: testUuid(3), score: 92.0 },
      ];

      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue(topTrends);

      const result = await trendRepository.findTopTrends(3);

      expect(db.select).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled(); // status = 'new'
      expect(db.orderBy).toHaveBeenCalled(); // order by score desc
      expect(db.limit).toHaveBeenCalledWith(3);
      expect(result).toHaveLength(3);
      expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
    });

    it('should default to limit of 10', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue([]);

      await trendRepository.findTopTrends();

      expect(db.limit).toHaveBeenCalledWith(10);
    });

    it('should enforce maximum limit of 100', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue([]);

      await trendRepository.findTopTrends(200);

      expect(db.limit).toHaveBeenCalledWith(100);
    });
  });

  describe('markAsUsed', () => {
    it('should mark trend as used for content', async () => {
      const usedTrend = {
        ...mockTrend,
        usedForContent: true,
        status: 'completed' as const,
      };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([usedTrend]);

      const result = await trendRepository.markAsUsed(testUuid(1));

      expect(db.update).toHaveBeenCalled();
      expect(result.usedForContent).toBe(true);
      expect(result.status).toBe('completed');
    });
  });

  describe('findBySource', () => {
    it('should find all trends from specific source', async () => {
      const redditTrends = [
        mockTrend,
        { ...mockTrend, id: testUuid(2) },
      ];

      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue(redditTrends);

      const result = await trendRepository.findBySource('reddit');

      expect(db.where).toHaveBeenCalled();
      expect(result.every((t) => t.source === 'reddit')).toBe(true);
    });

    it('should apply pagination to source filter', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([]);

      await trendRepository.findBySource('twitter', 20, 10);

      expect(db.limit).toHaveBeenCalledWith(20);
      expect(db.offset).toHaveBeenCalledWith(10);
    });
  });

  describe('findExpiring', () => {
    it('should find trends expiring within hours', async () => {
      const expiringDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
      const expiringTrend = {
        ...mockTrend,
        expiresAt: expiringDate,
      };

      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([expiringTrend]);

      const result = await trendRepository.findExpiring(24);

      expect(db.where).toHaveBeenCalled();
      expect(result[0].expiresAt).toBeDefined();
    });
  });

  describe('findUnused', () => {
    it('should find trends not yet used for content', async () => {
      const unusedTrends = [
        mockTrend,
        { ...mockTrend, id: testUuid(2) },
      ];

      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue(unusedTrends);

      const result = await trendRepository.findUnused();

      expect(db.where).toHaveBeenCalled();
      expect(result.every((t) => !t.usedForContent)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty result set', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([]);

      const result = await trendRepository.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle trends with null optional fields', async () => {
      const minimalTrend: Trend = {
        ...mockTrend,
        sourceUrl: null,
        sentiment: null,
        category: null,
        metadata: null,
        embedding: null,
        expiresAt: null,
      };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([minimalTrend]);

      const result = await trendRepository.create(testFactories.trend());

      expect(result.sourceUrl).toBeNull();
      expect(result.sentiment).toBeNull();
      expect(result.category).toBeNull();
    });

    it('should handle very high scores', async () => {
      const highScoreTrend = { ...mockTrend, score: 100.0 };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([highScoreTrend]);

      const result = await trendRepository.create(
        testFactories.trend({ score: 100.0 })
      );

      expect(result.score).toBe(100.0);
    });

    it('should handle very low scores', async () => {
      const lowScoreTrend = { ...mockTrend, score: 0.1 };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([lowScoreTrend]);

      const result = await trendRepository.create(
        testFactories.trend({ score: 0.1 })
      );

      expect(result.score).toBe(0.1);
    });
  });
});
