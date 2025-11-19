/**
 * PostRepository Tests
 *
 * Tests for post data access and status workflow operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postRepository } from '../post.repository';
import { testFactories, testUuid, mockDate } from '../../__tests__/setup';
import type { Post, NewPost } from '../../schema/posts';

// Mock the database
vi.mock('../../client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
}));

describe('PostRepository', () => {
  const mockPost: Post = {
    id: testUuid(1),
    trendId: testUuid(100),
    platform: 'twitter',
    content: 'Check out this amazing AI trend! #AI #Marketing',
    mediaUrls: ['https://example.com/image.jpg'],
    hashtags: ['AI', 'Marketing'],
    tone: 'professional',
    status: 'draft',
    qualityScore: 8.5,
    scheduledFor: null,
    publishedAt: null,
    externalPostId: null,
    failureReason: null,
    createdBy: testUuid(200),
    reviewedBy: null,
    reviewedAt: null,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new post successfully', async () => {
      const newPost: NewPost = testFactories.post({
        trendId: testUuid(100),
        content: 'New post content',
      });

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([mockPost]);

      const result = await postRepository.create(newPost);

      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(newPost);
      expect(result).toEqual(mockPost);
    });

    it('should create post without trend association', async () => {
      const standalonePost = testFactories.post({ trendId: undefined });

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([
        { ...mockPost, trendId: null },
      ]);

      const result = await postRepository.create(standalonePost);

      expect(result.trendId).toBeNull();
    });

    it('should create post with multiple media URLs', async () => {
      const mediaPost = testFactories.post({
        mediaUrls: ['url1.jpg', 'url2.jpg', 'url3.jpg'],
      });

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([
        { ...mockPost, mediaUrls: mediaPost.mediaUrls },
      ]);

      const result = await postRepository.create(mediaPost);

      expect(result.mediaUrls).toHaveLength(3);
    });
  });

  describe('findById', () => {
    it('should find post by id', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue([mockPost]);

      const result = await postRepository.findById(testUuid(1));

      expect(db.select).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(result).toEqual(mockPost);
    });

    it('should return null when post not found', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue([]);

      const result = await postRepository.findById(testUuid(999));

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithTrend', () => {
    it('should return post with associated trend', async () => {
      const mockTrend = {
        id: testUuid(100),
        title: 'AI Trend',
        hook: 'Test hook',
        source: 'reddit',
        score: 90.0,
      };

      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue([
        { posts: mockPost, trends: mockTrend },
      ]);

      const result = await postRepository.findByIdWithTrend(testUuid(1));

      expect(db.leftJoin).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result?.trend).toEqual(mockTrend);
    });

    it('should return post with null trend if not associated', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue([
        { posts: { ...mockPost, trendId: null }, trends: null },
      ]);

      const result = await postRepository.findByIdWithTrend(testUuid(1));

      expect(result?.trend).toBeNull();
    });

    it('should return null when post not found', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue([]);

      const result = await postRepository.findByIdWithTrend(testUuid(999));

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    const mockPosts: Post[] = [
      mockPost,
      { ...mockPost, id: testUuid(2), platform: 'linkedin' },
    ];

    it('should return all posts without filters', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue(mockPosts);

      const result = await postRepository.findAll();

      expect(result).toEqual(mockPosts);
    });

    it('should filter by platform', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([mockPost]);

      const result = await postRepository.findAll({ platform: 'twitter' });

      expect(db.where).toHaveBeenCalled();
      expect(result[0].platform).toBe('twitter');
    });

    it('should filter by status', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([mockPost]);

      const result = await postRepository.findAll({ status: 'draft' });

      expect(result[0].status).toBe('draft');
    });

    it('should filter by trend ID', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([mockPost]);

      const result = await postRepository.findAll({ trendId: testUuid(100) });

      expect(result[0].trendId).toBe(testUuid(100));
    });

    it('should apply pagination', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([]);

      await postRepository.findAll({ limit: 20, offset: 10 });

      expect(db.limit).toHaveBeenCalledWith(20);
      expect(db.offset).toHaveBeenCalledWith(10);
    });
  });

  describe('update', () => {
    it('should update post successfully', async () => {
      const updates = { content: 'Updated content', qualityScore: 9.0 };
      const updatedPost = { ...mockPost, ...updates };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([updatedPost]);

      const result = await postRepository.update(testUuid(1), updates);

      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith(updates);
      expect(result.content).toBe('Updated content');
      expect(result.qualityScore).toBe(9.0);
    });
  });

  describe('delete', () => {
    it('should delete post by id', async () => {
      const { db } = await import('../../client');

      await postRepository.delete(testUuid(1));

      expect(db.delete).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
    });
  });

  describe('count', () => {
    it('should count all posts', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.from).mockResolvedValue([{ count: 50 }]);

      const result = await postRepository.count();

      expect(result).toBe(50);
    });

    it('should count posts with filters', async () => {
      const { db } = await import('../../client');
      vi.mocked(db.from).mockResolvedValue([{ count: 10 }]);

      const result = await postRepository.count({ status: 'published' });

      expect(db.where).toHaveBeenCalled();
      expect(result).toBe(10);
    });
  });

  describe('approve', () => {
    it('should approve post for publishing', async () => {
      const reviewerId = testUuid(201);
      const scheduledDate = new Date('2025-02-01T10:00:00Z');

      const approvedPost = {
        ...mockPost,
        status: 'approved' as const,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        scheduledFor: scheduledDate,
      };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([approvedPost]);

      const result = await postRepository.approve(
        testUuid(1),
        reviewerId,
        scheduledDate
      );

      expect(result.status).toBe('approved');
      expect(result.reviewedBy).toBe(reviewerId);
      expect(result.reviewedAt).toBeDefined();
      expect(result.scheduledFor).toEqual(scheduledDate);
    });

    it('should approve without scheduling', async () => {
      const reviewerId = testUuid(201);

      const approvedPost = {
        ...mockPost,
        status: 'approved' as const,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([approvedPost]);

      const result = await postRepository.approve(testUuid(1), reviewerId);

      expect(result.status).toBe('approved');
      expect(result.scheduledFor).toBeUndefined();
    });
  });

  describe('reject', () => {
    it('should reject post with reason', async () => {
      const reviewerId = testUuid(201);
      const reason = 'Does not align with brand voice';

      const rejectedPost = {
        ...mockPost,
        status: 'rejected' as const,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        failureReason: reason,
      };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([rejectedPost]);

      const result = await postRepository.reject(testUuid(1), reviewerId, reason);

      expect(result.status).toBe('rejected');
      expect(result.reviewedBy).toBe(reviewerId);
      expect(result.reviewedAt).toBeDefined();
      expect(result.failureReason).toBe(reason);
    });
  });

  describe('markPublished', () => {
    it('should mark post as published with external ID', async () => {
      const externalId = 'twitter_123456789';

      const publishedPost = {
        ...mockPost,
        status: 'published' as const,
        publishedAt: new Date(),
        externalPostId: externalId,
      };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([publishedPost]);

      const result = await postRepository.markPublished(testUuid(1), externalId);

      expect(result.status).toBe('published');
      expect(result.publishedAt).toBeDefined();
      expect(result.externalPostId).toBe(externalId);
    });
  });

  describe('markFailed', () => {
    it('should mark post as failed with error reason', async () => {
      const errorReason = 'API rate limit exceeded';

      const failedPost = {
        ...mockPost,
        status: 'failed' as const,
        failureReason: errorReason,
      };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([failedPost]);

      const result = await postRepository.markFailed(testUuid(1), errorReason);

      expect(result.status).toBe('failed');
      expect(result.failureReason).toBe(errorReason);
    });
  });

  describe('findByPlatform', () => {
    it('should find all posts for specific platform', async () => {
      const twitterPosts = [
        mockPost,
        { ...mockPost, id: testUuid(2) },
      ];

      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue(twitterPosts);

      const result = await postRepository.findByPlatform('twitter');

      expect(result.every((p) => p.platform === 'twitter')).toBe(true);
    });
  });

  describe('findScheduled', () => {
    it('should find posts scheduled within date range', async () => {
      const fromDate = new Date('2025-01-01');
      const toDate = new Date('2025-01-31');

      const scheduledPost = {
        ...mockPost,
        scheduledFor: new Date('2025-01-15T10:00:00Z'),
      };

      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue([scheduledPost]);

      const result = await postRepository.findScheduled(fromDate, toDate);

      expect(db.where).toHaveBeenCalled();
      expect(result[0].scheduledFor).toBeDefined();
    });
  });

  describe('findByStatus', () => {
    it('should find all posts with specific status', async () => {
      const draftPosts = [mockPost, { ...mockPost, id: testUuid(2) }];

      const { db } = await import('../../client');
      vi.mocked(db.offset).mockResolvedValue(draftPosts);

      const result = await postRepository.findByStatus('draft');

      expect(result.every((p) => p.status === 'draft')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle post with empty arrays', async () => {
      const emptyPost: NewPost = {
        ...testFactories.post(),
        mediaUrls: [],
        hashtags: [],
      };

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([
        { ...mockPost, mediaUrls: [], hashtags: [] },
      ]);

      const result = await postRepository.create(emptyPost);

      expect(result.mediaUrls).toEqual([]);
      expect(result.hashtags).toEqual([]);
    });

    it('should handle long content', async () => {
      const longContent = 'A'.repeat(10000);
      const longPost = testFactories.post({ content: longContent });

      const { db } = await import('../../client');
      vi.mocked(db.returning).mockResolvedValue([
        { ...mockPost, content: longContent },
      ]);

      const result = await postRepository.create(longPost);

      expect(result.content).toHaveLength(10000);
    });

    it('should handle null optional fields', async () => {
      const minimalPost: Post = {
        ...mockPost,
        trendId: null,
        mediaUrls: null,
        hashtags: null,
        tone: null,
        qualityScore: null,
        scheduledFor: null,
        publishedAt: null,
        externalPostId: null,
        failureReason: null,
        createdBy: null,
        reviewedBy: null,
        reviewedAt: null,
      };

      const { db } = await import('../../client');
      vi.mocked(db.limit).mockResolvedValue([minimalPost]);

      const result = await postRepository.findById(testUuid(1));

      expect(result?.trendId).toBeNull();
      expect(result?.qualityScore).toBeNull();
    });
  });

  describe('Status Workflow', () => {
    it('should follow workflow: draft -> approved -> published', async () => {
      const { db } = await import('../../client');

      // Create draft
      vi.mocked(db.returning).mockResolvedValueOnce([mockPost]);
      const draft = await postRepository.create(testFactories.post());
      expect(draft.status).toBe('draft');

      // Approve
      const approved = { ...draft, status: 'approved' as const };
      vi.mocked(db.returning).mockResolvedValueOnce([approved]);
      const approvedPost = await postRepository.approve(draft.id, testUuid(201));
      expect(approvedPost.status).toBe('approved');

      // Publish
      const published = { ...approved, status: 'published' as const };
      vi.mocked(db.returning).mockResolvedValueOnce([published]);
      const publishedPost = await postRepository.markPublished(
        draft.id,
        'ext_123'
      );
      expect(publishedPost.status).toBe('published');
    });

    it('should allow workflow: draft -> rejected', async () => {
      const { db } = await import('../../client');

      vi.mocked(db.returning).mockResolvedValueOnce([mockPost]);
      const draft = await postRepository.create(testFactories.post());

      const rejected = { ...draft, status: 'rejected' as const };
      vi.mocked(db.returning).mockResolvedValueOnce([rejected]);
      const rejectedPost = await postRepository.reject(
        draft.id,
        testUuid(201),
        'Quality too low'
      );

      expect(rejectedPost.status).toBe('rejected');
    });

    it('should allow workflow: approved -> failed', async () => {
      const { db } = await import('../../client');

      const approved = { ...mockPost, status: 'approved' as const };
      vi.mocked(db.returning).mockResolvedValueOnce([approved]);

      const failed = { ...approved, status: 'failed' as const };
      vi.mocked(db.returning).mockResolvedValueOnce([failed]);
      const failedPost = await postRepository.markFailed(
        mockPost.id,
        'Network error'
      );

      expect(failedPost.status).toBe('failed');
    });
  });
});
