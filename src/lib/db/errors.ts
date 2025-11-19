/**
 * Base class for all database-related errors
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when database connection fails
 */
export class ConnectionError extends DatabaseError {
  constructor(
    message: string,
    public readonly host?: string,
    public readonly port?: number,
    cause?: Error
  ) {
    super(message, cause);
    this.name = 'ConnectionError';
  }
}

/**
 * Error thrown when a query execution fails
 */
export class QueryError extends DatabaseError {
  constructor(
    message: string,
    public readonly query?: string,
    public readonly params?: any[],
    cause?: Error
  ) {
    super(message, cause);
    this.name = 'QueryError';
  }
}

/**
 * Error thrown when a transaction fails
 */
export class TransactionError extends DatabaseError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'TransactionError';
  }
}

/**
 * Error thrown when migration fails
 */
export class MigrationError extends DatabaseError {
  constructor(
    message: string,
    public readonly migrationName?: string,
    cause?: Error
  ) {
    super(message, cause);
    this.name = 'MigrationError';
  }
}
