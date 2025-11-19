/**
 * Retry Utilities
 *
 * Provides functions for retry logic with exponential backoff.
 * Used throughout the Mastra integration for resilient operations.
 */

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Backoff times in milliseconds for each retry */
  backoffMs: number[];
  /** Whether to log retry attempts */
  logRetries?: boolean;
  /** Function to determine if error is retryable */
  isRetryable?: (error: Error) => boolean;
}

/**
 * Default retry configuration
 */
export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  backoffMs: [2000, 4000, 8000],
  logRetries: true,
  isRetryable: () => true,
};

/**
 * Calculate backoff time for a given retry attempt
 *
 * @param attempt - The current retry attempt (0-indexed)
 * @param backoffMs - Array of backoff times in milliseconds
 * @returns Backoff time in milliseconds
 */
export function calculateBackoff(attempt: number, backoffMs: number[]): number {
  if (attempt >= backoffMs.length) {
    return backoffMs[backoffMs.length - 1];
  }
  return backoffMs[attempt];
}

/**
 * Sleep for a specified duration
 *
 * @param ms - Duration in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - The function to execute
 * @param config - Retry configuration
 * @returns The result of the function
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => await fetchData(),
 *   { maxRetries: 3, backoffMs: [1000, 2000, 4000] }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, backoffMs, logRetries, isRetryable } = {
    ...defaultRetryConfig,
    ...config,
  };

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt >= maxRetries) {
        break;
      }

      // Check if error is retryable
      if (isRetryable && !isRetryable(lastError)) {
        break;
      }

      // Calculate and apply backoff
      const backoffTime = calculateBackoff(attempt, backoffMs);

      if (logRetries) {
        console.warn(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${backoffTime}ms. Error: ${lastError.message}`
        );
      }

      await sleep(backoffTime);
    }
  }

  throw lastError!;
}

/**
 * Check if an error is a transient error that can be retried
 *
 * @param error - The error to check
 * @returns Whether the error is transient
 */
export function isTransientError(error: Error): boolean {
  const transientPatterns = [
    /timeout/i,
    /ETIMEDOUT/,
    /ECONNRESET/,
    /ECONNREFUSED/,
    /network/i,
    /rate.?limit/i,
    /429/,
    /503/,
    /502/,
    /500/,
    /temporarily.?unavailable/i,
  ];

  const errorString = error.message + (error.name || '');
  return transientPatterns.some((pattern) => pattern.test(errorString));
}

/**
 * Retry configuration for LLM API calls
 */
export const llmRetryConfig: RetryConfig = {
  maxRetries: 3,
  backoffMs: [2000, 4000, 8000],
  logRetries: true,
  isRetryable: isTransientError,
};

/**
 * Retry configuration for database operations
 */
export const dbRetryConfig: RetryConfig = {
  maxRetries: 2,
  backoffMs: [1000, 2000],
  logRetries: true,
  isRetryable: isTransientError,
};

/**
 * Execute an LLM call with appropriate retry logic
 *
 * @param fn - The LLM call function
 * @returns The result of the LLM call
 *
 * @example
 * ```typescript
 * const response = await retryLLMCall(
 *   async () => await agent.generate(prompt)
 * );
 * ```
 */
export async function retryLLMCall<T>(fn: () => Promise<T>): Promise<T> {
  return retryWithBackoff(fn, llmRetryConfig);
}

/**
 * Execute a database operation with appropriate retry logic
 *
 * @param fn - The database operation function
 * @returns The result of the database operation
 *
 * @example
 * ```typescript
 * const trends = await retryDBOperation(
 *   async () => await trendRepository.findAll()
 * );
 * ```
 */
export async function retryDBOperation<T>(fn: () => Promise<T>): Promise<T> {
  return retryWithBackoff(fn, dbRetryConfig);
}

/**
 * Timeout wrapper for async functions
 *
 * @param fn - The function to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Error message for timeout
 * @returns The result of the function
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   async () => await longRunningOperation(),
 *   30000,
 *   'Operation timed out'
 * );
 * ```
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}
