/**
 * Error Handler Tests
 *
 * Tests for error classification, handling, and logging utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ErrorType,
  classifyError,
  createClassifiedError,
  logError,
  handleError,
  withErrorHandling,
  createErrorResponse,
} from '../../utils/error-handler';

describe('Error Handler Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('classifyError', () => {
    it('should classify Connection timeout as transient', () => {
      const error = new Error('Connection timeout');
      expect(classifyError(error)).toBe(ErrorType.TRANSIENT);
    });

    it('should classify timeout errors as transient', () => {
      const error = new Error('Request timeout');
      expect(classifyError(error)).toBe(ErrorType.TRANSIENT);
    });

    it('should classify rate limit errors', () => {
      const error = new Error('rate limit exceeded');
      expect(classifyError(error)).toBe(ErrorType.RATE_LIMIT);
    });

    it('should classify 429 as rate limit', () => {
      const error = new Error('429 Too Many Requests');
      expect(classifyError(error)).toBe(ErrorType.RATE_LIMIT);
    });

    it('should classify validation errors', () => {
      const error = new Error('Validation failed');
      expect(classifyError(error)).toBe(ErrorType.VALIDATION);
    });

    it('should classify invalid input errors', () => {
      const error = new Error('Invalid input');
      expect(classifyError(error)).toBe(ErrorType.VALIDATION);
    });

    it('should classify Zod errors as validation', () => {
      const error = new Error('Required field missing');
      expect(classifyError(error)).toBe(ErrorType.VALIDATION);
    });

    it('should classify unauthorized errors', () => {
      const error = new Error('Unauthorized');
      expect(classifyError(error)).toBe(ErrorType.AUTH);
    });

    it('should classify 401 as auth error', () => {
      const error = new Error('401 Unauthorized');
      expect(classifyError(error)).toBe(ErrorType.AUTH);
    });

    it('should classify 403 as auth error', () => {
      const error = new Error('403 Forbidden');
      expect(classifyError(error)).toBe(ErrorType.AUTH);
    });

    it('should classify unknown errors', () => {
      const error = new Error('Something went wrong');
      expect(classifyError(error)).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('createClassifiedError', () => {
    it('should create error with classification', () => {
      const error = new Error('Connection timeout');
      const classified = createClassifiedError(error);

      expect(classified.message).toBe('Connection timeout');
      expect(classified.type).toBe(ErrorType.TRANSIENT);
      expect(classified.originalError).toBe(error);
    });

    it('should preserve original error reference', () => {
      const error = new Error('Test error');
      const classified = createClassifiedError(error);

      expect(classified.originalError).toBe(error);
      expect(classified.originalError.stack).toBeDefined();
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      logError(error, { operation: 'test', userId: '123' });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(logCall[0]).toContain('[Mastra Error]');

      consoleSpy.mockRestore();
    });

    it('should log error type', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Connection timeout');

      logError(error, { operation: 'test' });

      const logOutput = JSON.stringify(consoleSpy.mock.calls);
      expect(logOutput).toContain('TRANSIENT');

      consoleSpy.mockRestore();
    });
  });

  describe('handleError', () => {
    it('should return classified error for transient errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Connection timeout');

      const result = handleError(error, { operation: 'test' });

      expect(result.type).toBe(ErrorType.TRANSIENT);
      consoleSpy.mockRestore();
    });

    it('should handle different error types', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const validationError = new Error('Validation failed');

      const result = handleError(validationError, { operation: 'validate' });

      expect(result.type).toBe(ErrorType.VALIDATION);
      consoleSpy.mockRestore();
    });
  });

  describe('withErrorHandling', () => {
    it('should return result on success', async () => {
      const fn = async () => 'success';

      const result = await withErrorHandling(fn, { operation: 'test' });

      expect(result).toBe('success');
    });

    it('should classify and rethrow errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const fn = async () => {
        throw new Error('Connection timeout');
      };

      await expect(withErrorHandling(fn, { operation: 'test' })).rejects.toThrow('Connection timeout');
      consoleSpy.mockRestore();
    });
  });

  describe('createErrorResponse', () => {
    it('should create response for transient error', () => {
      const error = new Error('Connection timeout');
      const response = createErrorResponse(error);

      expect(response.error).toBe(ErrorType.TRANSIENT);
      expect(response.message).toBeDefined();
      expect(response.retryable).toBe(true);
    });

    it('should create response for validation error', () => {
      const error = new Error('Validation failed');
      const response = createErrorResponse(error);

      expect(response.error).toBe(ErrorType.VALIDATION);
      expect(response.retryable).toBe(false);
    });

    it('should create response for rate limit error', () => {
      const error = new Error('429 Too Many Requests');
      const response = createErrorResponse(error);

      expect(response.error).toBe(ErrorType.RATE_LIMIT);
      expect(response.retryable).toBe(true);
    });

    it('should create response for auth error', () => {
      const error = new Error('Unauthorized');
      const response = createErrorResponse(error);

      expect(response.error).toBe(ErrorType.AUTH);
      expect(response.retryable).toBe(false);
    });
  });
});
