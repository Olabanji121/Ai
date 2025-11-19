/**
 * Retry Utility Tests
 *
 * Tests for retry logic with exponential backoff
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  retryWithBackoff,
  isTransientError,
  withTimeout,
  llmRetryConfig,
  dbRetryConfig,
} from '../../utils/retry';

describe('Retry Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  describe('isTransientError', () => {
    it('should identify ECONNRESET as transient', () => {
      const error = new Error('ECONNRESET');
      expect(isTransientError(error)).toBe(true);
    });

    it('should identify ETIMEDOUT as transient', () => {
      const error = new Error('ETIMEDOUT');
      expect(isTransientError(error)).toBe(true);
    });

    it('should identify ECONNREFUSED as transient', () => {
      const error = new Error('ECONNREFUSED');
      expect(isTransientError(error)).toBe(true);
    });

    it('should identify rate limit errors as transient', () => {
      const error = new Error('rate limit exceeded');
      expect(isTransientError(error)).toBe(true);
    });

    it('should identify 429 errors as transient', () => {
      const error = new Error('429 Too Many Requests');
      expect(isTransientError(error)).toBe(true);
    });

    it('should identify 503 errors as transient', () => {
      const error = new Error('503 Service Unavailable');
      expect(isTransientError(error)).toBe(true);
    });

    it('should identify 502 errors as transient', () => {
      const error = new Error('502 Bad Gateway');
      expect(isTransientError(error)).toBe(true);
    });

    it('should not identify validation errors as transient', () => {
      const error = new Error('Invalid input');
      expect(isTransientError(error)).toBe(false);
    });

    it('should not identify auth errors as transient', () => {
      const error = new Error('Unauthorized access');
      expect(isTransientError(error)).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt without retry', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient error and succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success');

      const resultPromise = retryWithBackoff(fn, { maxRetries: 3, backoffMs: [100, 200, 400] });

      // Fast-forward through the backoff delay
      await vi.advanceTimersByTimeAsync(100);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries exceeded', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('ECONNRESET'));

      const resultPromise = retryWithBackoff(fn, { maxRetries: 2, backoffMs: [100, 200] });

      // Fast-forward through all backoff delays
      await vi.advanceTimersByTimeAsync(300);

      await expect(resultPromise).rejects.toThrow('ECONNRESET');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry non-transient errors by default', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Invalid input'));

      await expect(retryWithBackoff(fn)).rejects.toThrow('Invalid input');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use custom isRetryable function', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('custom error'))
        .mockResolvedValue('success');

      const resultPromise = retryWithBackoff(fn, {
        maxRetries: 2,
        backoffMs: [100],
        isRetryable: (error) => error.message === 'custom error',
      });

      await vi.advanceTimersByTimeAsync(100);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should log retries when enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success');

      const resultPromise = retryWithBackoff(fn, {
        maxRetries: 2,
        backoffMs: [100],
        logRetries: true,
      });

      await vi.advanceTimersByTimeAsync(100);
      await resultPromise;

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('withTimeout', () => {
    it('should resolve before timeout', async () => {
      const fn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'success';
      };

      const resultPromise = withTimeout(fn, 1000);
      await vi.advanceTimersByTimeAsync(50);

      const result = await resultPromise;
      expect(result).toBe('success');
    });

    it('should reject on timeout', async () => {
      const fn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return 'success';
      };

      const resultPromise = withTimeout(fn, 100);
      await vi.advanceTimersByTimeAsync(100);

      await expect(resultPromise).rejects.toThrow('Operation timed out');
    });
  });

  describe('Config Presets', () => {
    it('should have correct llmRetryConfig values', () => {
      expect(llmRetryConfig.maxRetries).toBe(3);
      expect(llmRetryConfig.backoffMs).toEqual([2000, 4000, 8000]);
      expect(llmRetryConfig.logRetries).toBe(true);
    });

    it('should have correct dbRetryConfig values', () => {
      expect(dbRetryConfig.maxRetries).toBe(2);
      expect(dbRetryConfig.backoffMs).toEqual([1000, 2000]);
      expect(dbRetryConfig.logRetries).toBe(true);
    });
  });
});
