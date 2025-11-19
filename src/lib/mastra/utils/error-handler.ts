/**
 * Error Handler Utilities
 *
 * Provides centralized error handling, classification, and logging
 * for the Mastra AI integration.
 */

/**
 * Error types for classification
 */
export enum ErrorType {
  /** Temporary errors that may succeed on retry */
  TRANSIENT = 'TRANSIENT',
  /** Permanent errors that won't succeed on retry */
  PERMANENT = 'PERMANENT',
  /** Validation errors from invalid input */
  VALIDATION = 'VALIDATION',
  /** Authentication/authorization errors */
  AUTH = 'AUTH',
  /** Rate limiting errors */
  RATE_LIMIT = 'RATE_LIMIT',
  /** Unknown error type */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Classified error with additional context
 */
export interface ClassifiedError {
  type: ErrorType;
  message: string;
  originalError: Error;
  context?: Record<string, unknown>;
  retryable: boolean;
  userMessage: string;
}

/**
 * Classify an error by type
 *
 * @param error - The error to classify
 * @returns The error type
 */
export function classifyError(error: Error): ErrorType {
  const errorString = (error.message + (error.name || '')).toLowerCase();

  // Rate limiting
  if (errorString.includes('rate') || errorString.includes('429') || errorString.includes('quota')) {
    return ErrorType.RATE_LIMIT;
  }

  // Authentication
  if (
    errorString.includes('auth') ||
    errorString.includes('401') ||
    errorString.includes('403') ||
    errorString.includes('api key') ||
    errorString.includes('unauthorized')
  ) {
    return ErrorType.AUTH;
  }

  // Validation
  if (
    errorString.includes('validation') ||
    errorString.includes('invalid') ||
    errorString.includes('required') ||
    errorString.includes('missing')
  ) {
    return ErrorType.VALIDATION;
  }

  // Transient errors
  if (
    errorString.includes('timeout') ||
    errorString.includes('network') ||
    errorString.includes('ETIMEDOUT') ||
    errorString.includes('ECONNRESET') ||
    errorString.includes('500') ||
    errorString.includes('502') ||
    errorString.includes('503')
  ) {
    return ErrorType.TRANSIENT;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Create a classified error with full context
 *
 * @param error - The original error
 * @param context - Additional context about the error
 * @returns Classified error object
 */
export function createClassifiedError(
  error: Error,
  context?: Record<string, unknown>
): ClassifiedError {
  const type = classifyError(error);

  const typeMessages: Record<ErrorType, string> = {
    [ErrorType.TRANSIENT]: 'A temporary error occurred. Please try again.',
    [ErrorType.PERMANENT]: 'An error occurred that cannot be automatically resolved.',
    [ErrorType.VALIDATION]: 'The input provided is invalid.',
    [ErrorType.AUTH]: 'Authentication failed. Please check your API keys.',
    [ErrorType.RATE_LIMIT]: 'Rate limit exceeded. Please wait before trying again.',
    [ErrorType.UNKNOWN]: 'An unexpected error occurred.',
  };

  const retryableTypes = [ErrorType.TRANSIENT, ErrorType.RATE_LIMIT];

  return {
    type,
    message: error.message,
    originalError: error,
    context,
    retryable: retryableTypes.includes(type),
    userMessage: typeMessages[type],
  };
}

/**
 * Log an error with context
 *
 * @param error - The error to log
 * @param context - Additional context
 * @param level - Log level
 */
export function logError(
  error: Error | ClassifiedError,
  context?: Record<string, unknown>,
  level: 'error' | 'warn' | 'info' = 'error'
): void {
  const isClassified = 'type' in error;
  const timestamp = new Date().toISOString();

  const logData = {
    timestamp,
    level,
    type: isClassified ? error.type : classifyError(error as Error),
    message: isClassified ? error.message : (error as Error).message,
    context: isClassified ? { ...error.context, ...context } : context,
    stack: isClassified ? error.originalError.stack : (error as Error).stack,
  };

  switch (level) {
    case 'error':
      console.error('[Mastra Error]', JSON.stringify(logData, null, 2));
      break;
    case 'warn':
      console.warn('[Mastra Warning]', JSON.stringify(logData, null, 2));
      break;
    case 'info':
      console.info('[Mastra Info]', JSON.stringify(logData, null, 2));
      break;
  }
}

/**
 * Handle an error with classification, logging, and optional notification
 *
 * @param error - The error to handle
 * @param context - Additional context
 * @returns The classified error
 */
export function handleError(
  error: Error,
  context?: Record<string, unknown>
): ClassifiedError {
  const classified = createClassifiedError(error, context);

  // Log the error
  logError(classified, context);

  // TODO: Add notification system integration
  // if (classified.type === ErrorType.AUTH || classified.type === ErrorType.PERMANENT) {
  //   notifyAdmins(classified);
  // }

  return classified;
}

/**
 * Wrap a function with error handling
 *
 * @param fn - The function to wrap
 * @param context - Context to include in error logs
 * @returns The wrapped function result
 *
 * @example
 * ```typescript
 * const result = await withErrorHandling(
 *   async () => await riskyOperation(),
 *   { operation: 'trend-discovery', step: 'fetch' }
 * );
 * ```
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const classified = handleError(
      error instanceof Error ? error : new Error(String(error)),
      context
    );
    throw classified.originalError;
  }
}

/**
 * Create a user-friendly error response for API routes
 *
 * @param error - The error to format
 * @returns User-friendly error response object
 */
export function createErrorResponse(error: Error | ClassifiedError): {
  error: string;
  message: string;
  retryable: boolean;
} {
  const isClassified = 'type' in error;

  if (isClassified) {
    return {
      error: error.type,
      message: error.userMessage,
      retryable: error.retryable,
    };
  }

  const classified = createClassifiedError(error as Error);
  return {
    error: classified.type,
    message: classified.userMessage,
    retryable: classified.retryable,
  };
}
