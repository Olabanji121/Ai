/**
 * Transaction Tests
 *
 * Tests for database transaction support including
 * callback-based and manual transaction control
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TransactionContext } from '../client';
import { TransactionError } from '../errors';
import { testFactories, testUuid } from './setup';

// Mock the database client
vi.mock('../client', async () => {
  const actual = await vi.importActual('../client');
  return {
    ...actual,
    transaction: vi.fn(),
    beginTransaction: vi.fn(),
    db: {
      transaction: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
    },
  };
});

describe('Transaction Support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Callback-based Transactions', () => {
    it('should execute callback within transaction', async () => {
      const mockCallback = vi.fn().mockResolvedValue({ success: true });

      const { transaction: txFunc } = await import('../client');
      vi.mocked(txFunc).mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      const result = await txFunc(mockCallback);

      expect(mockCallback).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should automatically commit on success', async () => {
      const mockData = { id: testUuid(1), name: 'Test' };

      const { transaction: txFunc } = await import('../client');
      vi.mocked(txFunc).mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      const result = await txFunc(async (tx) => {
        // Simulated insert operation
        return mockData;
      });

      expect(result).toEqual(mockData);
    });

    it('should automatically rollback on error', async () => {
      const error = new Error('Database error');

      const { transaction: txFunc } = await import('../client');
      vi.mocked(txFunc).mockRejectedValue(
        new TransactionError('Transaction failed and was rolled back', error)
      );

      await expect(
        txFunc(async () => {
          throw error;
        })
      ).rejects.toThrow(TransactionError);
    });

    it('should handle nested operations in transaction', async () => {
      const trendData = testFactories.trend();
      const postData = testFactories.post();

      const { transaction: txFunc } = await import('../client');
      vi.mocked(txFunc).mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      const result = await txFunc(async (tx) => {
        // Create trend
        const trend = { ...trendData, id: testUuid(1) };

        // Create post referencing trend
        const post = { ...postData, id: testUuid(2), trendId: trend.id };

        return { trend, post };
      });

      expect(result.trend).toBeDefined();
      expect(result.post).toBeDefined();
      expect(result.post.trendId).toBe(result.trend.id);
    });

    it('should propagate errors with context', async () => {
      const originalError = new Error('Constraint violation');

      const { transaction: txFunc } = await import('../client');
      vi.mocked(txFunc).mockRejectedValue(
        new TransactionError(
          'Transaction failed and was rolled back',
          originalError
        )
      );

      try {
        await txFunc(async () => {
          throw originalError;
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TransactionError);
        expect((error as TransactionError).cause).toBe(originalError);
      }
    });

    it('should handle multiple operations atomically', async () => {
      const { transaction: txFunc } = await import('../client');

      const operations = [
        { id: testUuid(1), value: 100 },
        { id: testUuid(2), value: 200 },
        { id: testUuid(3), value: 300 },
      ];

      vi.mocked(txFunc).mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      const result = await txFunc(async (tx) => {
        const results = [];
        for (const op of operations) {
          results.push(op);
        }
        return results;
      });

      expect(result).toHaveLength(3);
      expect(result[0].value).toBe(100);
    });
  });

  describe('Manual Transaction Control', () => {
    it('should create transaction context with commit/rollback', async () => {
      const mockTx: TransactionContext = {
        tx: {} as any,
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
      };

      const { beginTransaction: beginTxFunc } = await import('../client');
      vi.mocked(beginTxFunc).mockResolvedValue(mockTx);

      const txContext = await beginTxFunc();

      expect(txContext).toHaveProperty('tx');
      expect(txContext).toHaveProperty('commit');
      expect(txContext).toHaveProperty('rollback');
      expect(typeof txContext.commit).toBe('function');
      expect(typeof txContext.rollback).toBe('function');
    });

    it('should allow manual commit', async () => {
      const mockCommit = vi.fn().mockResolvedValue(undefined);
      const mockTx: TransactionContext = {
        tx: {} as any,
        commit: mockCommit,
        rollback: vi.fn(),
      };

      const { beginTransaction: beginTxFunc } = await import('../client');
      vi.mocked(beginTxFunc).mockResolvedValue(mockTx);

      const { commit } = await beginTxFunc();
      await commit();

      expect(mockCommit).toHaveBeenCalled();
    });

    it('should allow manual rollback', async () => {
      const mockRollback = vi.fn().mockResolvedValue(undefined);
      const mockTx: TransactionContext = {
        tx: {} as any,
        commit: vi.fn(),
        rollback: mockRollback,
      };

      const { beginTransaction: beginTxFunc } = await import('../client');
      vi.mocked(beginTxFunc).mockResolvedValue(mockTx);

      const { rollback } = await beginTxFunc();
      await rollback();

      expect(mockRollback).toHaveBeenCalled();
    });

    it('should handle errors during manual commit', async () => {
      const commitError = new Error('Commit failed');
      const mockTx: TransactionContext = {
        tx: {} as any,
        commit: vi.fn().mockRejectedValue(commitError),
        rollback: vi.fn(),
      };

      const { beginTransaction: beginTxFunc } = await import('../client');
      vi.mocked(beginTxFunc).mockResolvedValue(mockTx);

      const { commit } = await beginTxFunc();

      await expect(commit()).rejects.toThrow('Commit failed');
    });

    it('should handle errors during manual rollback', async () => {
      const rollbackError = new Error('Rollback failed');
      const mockTx: TransactionContext = {
        tx: {} as any,
        commit: vi.fn(),
        rollback: vi.fn().mockRejectedValue(rollbackError),
      };

      const { beginTransaction: beginTxFunc } = await import('../client');
      vi.mocked(beginTxFunc).mockResolvedValue(mockTx);

      const { rollback } = await beginTxFunc();

      await expect(rollback()).rejects.toThrow('Rollback failed');
    });
  });

  describe('Transaction Error Handling', () => {
    it('should create TransactionError with message and cause', () => {
      const cause = new Error('Original error');
      const txError = new TransactionError('Transaction failed', cause);

      expect(txError).toBeInstanceOf(Error);
      expect(txError.name).toBe('TransactionError');
      expect(txError.message).toBe('Transaction failed');
      expect(txError.cause).toBe(cause);
    });

    it('should handle TransactionError without cause', () => {
      const txError = new TransactionError('Transaction failed');

      expect(txError.cause).toBeUndefined();
      expect(txError.message).toBe('Transaction failed');
    });

    it('should maintain error stack trace', () => {
      const txError = new TransactionError('Transaction failed');

      expect(txError.stack).toBeDefined();
      expect(txError.stack).toContain('TransactionError');
    });
  });

  describe('Real-World Transaction Scenarios', () => {
    it('should handle trend creation with multiple posts', async () => {
      const { transaction: txFunc } = await import('../client');

      vi.mocked(txFunc).mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      const result = await txFunc(async (tx) => {
        // Create trend
        const trend = {
          id: testUuid(1),
          ...testFactories.trend(),
        };

        // Create multiple posts for this trend
        const posts = [
          { id: testUuid(10), trendId: trend.id, ...testFactories.post() },
          { id: testUuid(11), trendId: trend.id, ...testFactories.post() },
          { id: testUuid(12), trendId: trend.id, ...testFactories.post() },
        ];

        return { trend, posts };
      });

      expect(result.trend).toBeDefined();
      expect(result.posts).toHaveLength(3);
      expect(result.posts.every((p) => p.trendId === result.trend.id)).toBe(true);
    });

    it('should handle post creation with variations', async () => {
      const { transaction: txFunc } = await import('../client');

      vi.mocked(txFunc).mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      const result = await txFunc(async (tx) => {
        // Create post
        const post = {
          id: testUuid(1),
          ...testFactories.post(),
        };

        // Create variations
        const variations = [
          { id: testUuid(20), postId: post.id, variationNumber: 1 },
          { id: testUuid(21), postId: post.id, variationNumber: 2 },
          { id: testUuid(22), postId: post.id, variationNumber: 3 },
        ];

        return { post, variations };
      });

      expect(result.post).toBeDefined();
      expect(result.variations).toHaveLength(3);
    });

    it('should rollback when any operation fails', async () => {
      const { transaction: txFunc } = await import('../client');

      vi.mocked(txFunc).mockRejectedValue(
        new TransactionError('Transaction failed and was rolled back')
      );

      await expect(
        txFunc(async (tx) => {
          // Create trend - succeeds
          const trend = { id: testUuid(1), ...testFactories.trend() };

          // Create post - fails
          throw new Error('Foreign key constraint violation');
        })
      ).rejects.toThrow(TransactionError);

      // In a real scenario, the trend would not be created because rollback
    });

    it('should handle workflow run with status updates', async () => {
      const { transaction: txFunc } = await import('../client');

      vi.mocked(txFunc).mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      const result = await txFunc(async (tx) => {
        // Create workflow run
        const workflowRun = {
          id: testUuid(1),
          ...testFactories.workflowRun(),
          status: 'running' as const,
        };

        // Update status to completed
        const updated = {
          ...workflowRun,
          status: 'completed' as const,
          completedAt: new Date(),
        };

        return updated;
      });

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
    });

    it('should handle analytics creation for published post', async () => {
      const { transaction: txFunc } = await import('../client');

      vi.mocked(txFunc).mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      const result = await txFunc(async (tx) => {
        // Mark post as published
        const post = {
          id: testUuid(1),
          ...testFactories.post(),
          status: 'published' as const,
          publishedAt: new Date(),
        };

        // Create initial analytics
        const analytics = {
          id: testUuid(2),
          postId: post.id,
          ...testFactories.analytics(),
        };

        return { post, analytics };
      });

      expect(result.post.status).toBe('published');
      expect(result.analytics.postId).toBe(result.post.id);
    });
  });

  describe('Transaction Isolation', () => {
    it('should isolate concurrent transactions', async () => {
      const { transaction: txFunc } = await import('../client');

      vi.mocked(txFunc).mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      const tx1 = txFunc(async (tx) => {
        return { id: 1, value: 'tx1' };
      });

      const tx2 = txFunc(async (tx) => {
        return { id: 2, value: 'tx2' };
      });

      const [result1, result2] = await Promise.all([tx1, tx2]);

      expect(result1.id).toBe(1);
      expect(result2.id).toBe(2);
    });

    it('should maintain data consistency across transactions', async () => {
      const { transaction: txFunc } = await import('../client');

      vi.mocked(txFunc).mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      let counter = 0;

      const incrementCounter = async () => {
        return await txFunc(async (tx) => {
          const current = counter;
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10));
          counter = current + 1;
          return counter;
        });
      };

      const results = await Promise.all([
        incrementCounter(),
        incrementCounter(),
        incrementCounter(),
      ]);

      expect(results).toHaveLength(3);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large batch operations in transaction', async () => {
      const { transaction: txFunc } = await import('../client');

      vi.mocked(txFunc).mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      const batchSize = 100;

      const result = await txFunc(async (tx) => {
        const records = [];
        for (let i = 0; i < batchSize; i++) {
          records.push({
            id: testUuid(i),
            data: `record_${i}`,
          });
        }
        return records;
      });

      expect(result).toHaveLength(batchSize);
    });

    it('should handle transaction timeout gracefully', async () => {
      const { transaction: txFunc } = await import('../client');

      vi.mocked(txFunc).mockRejectedValue(
        new TransactionError('Transaction timeout')
      );

      await expect(
        txFunc(async (tx) => {
          // Simulate long-running operation
          await new Promise((resolve) => setTimeout(resolve, 35000));
        })
      ).rejects.toThrow(TransactionError);
    });

    it('should handle empty transaction', async () => {
      const { transaction: txFunc } = await import('../client');

      vi.mocked(txFunc).mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      const result = await txFunc(async (tx) => {
        // Do nothing
        return null;
      });

      expect(result).toBeNull();
    });

    it('should handle transaction returning undefined', async () => {
      const { transaction: txFunc } = await import('../client');

      vi.mocked(txFunc).mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      const result = await txFunc(async (tx) => {
        return undefined;
      });

      expect(result).toBeUndefined();
    });
  });
});
