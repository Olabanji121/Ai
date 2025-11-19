import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { ConnectionError, TransactionError } from './errors';

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new ConnectionError(
    'DATABASE_URL environment variable is not set. Please configure your database connection string.'
  );
}

/**
 * PostgreSQL connection configuration
 * Based on project.md requirements:
 * - Max 10 connections
 * - 30s idle timeout
 * - 10s connection timeout
 * - 30s statement timeout
 */
const connectionConfig: postgres.Options<{}> = {
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 30, // Close idle connections after 30 seconds
  connect_timeout: 10, // Timeout for establishing connection (seconds)
  statement_timeout: 30000, // 30 seconds in milliseconds
  prepare: false, // Disable prepared statements for transaction pool mode
};

/**
 * Create PostgreSQL client with connection pooling
 */
let client: postgres.Sql | null = null;

try {
  client = postgres(DATABASE_URL, connectionConfig);
} catch (error) {
  throw new ConnectionError(
    'Failed to create database client',
    undefined,
    undefined,
    error instanceof Error ? error : new Error(String(error))
  );
}

/**
 * Drizzle ORM instance with schema
 * This is the main database client used throughout the application
 */
export const db = drizzle(client, { schema });

/**
 * Get the raw PostgreSQL client (for advanced use cases)
 */
export const getClient = () => client;

/**
 * Close all database connections gracefully
 * Should be called when the application is shutting down
 */
export const disconnect = async (): Promise<void> => {
  if (client) {
    await client.end();
    client = null;
  }
};

/**
 * Database health check
 * Executes a simple query to verify database connectivity
 *
 * @returns true if database is accessible, false otherwise
 * @timeout 5 seconds
 */
export const healthCheck = async (): Promise<boolean> => {
  if (!client) {
    return false;
  }

  try {
    // Simple SELECT 1 query with 5 second timeout
    const result = await Promise.race([
      client`SELECT 1 as health`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      )
    ]);

    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

/**
 * Get connection pool statistics
 * Useful for monitoring and debugging
 */
export const getPoolStats = () => {
  if (!client) {
    return null;
  }

  // Note: postgres.js doesn't expose pool stats directly
  // This is a placeholder for future implementation if needed
  return {
    message: 'Pool statistics not available in current postgres.js version',
  };
};

/**
 * Execute a callback within a database transaction
 *
 * This is the recommended approach for transactions as it automatically
 * handles commit and rollback based on success or error.
 *
 * @param callback - Function to execute within the transaction
 * @returns The result of the callback
 * @throws TransactionError if the transaction fails
 *
 * @example
 * ```typescript
 * const result = await transaction(async (tx) => {
 *   const trend = await tx.insert(trends).values(data).returning();
 *   const post = await tx.insert(posts).values(postData).returning();
 *   return { trend, post };
 * });
 * ```
 */
export async function transaction<T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  try {
    return await db.transaction(async (tx) => {
      return await callback(tx as typeof db);
    });
  } catch (error) {
    throw new TransactionError(
      'Transaction failed and was rolled back',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Transaction context for manual transaction control
 * Use this for advanced scenarios where you need explicit control
 */
export interface TransactionContext {
  /**
   * The transaction database instance
   * Use this instead of `db` for all queries within the transaction
   */
  tx: typeof db;

  /**
   * Commit the transaction
   * All changes will be persisted to the database
   */
  commit: () => Promise<void>;

  /**
   * Rollback the transaction
   * All changes will be discarded
   */
  rollback: () => Promise<void>;
}

/**
 * Begin a manual transaction
 *
 * Use this for advanced scenarios where you need explicit control over
 * transaction lifecycle. You must manually call commit() or rollback().
 *
 * @returns Transaction context with tx, commit, and rollback methods
 * @throws TransactionError if transaction cannot be started
 *
 * @example
 * ```typescript
 * const { tx, commit, rollback } = await beginTransaction();
 * try {
 *   await tx.insert(trends).values(data);
 *   await tx.insert(posts).values(postData);
 *   await commit();
 * } catch (error) {
 *   await rollback();
 *   throw error;
 * }
 * ```
 */
export async function beginTransaction(): Promise<TransactionContext> {
  try {
    let transactionDb: typeof db;
    let commitFn: () => void;
    let rollbackFn: () => void;

    const transactionPromise = new Promise<typeof db>((resolve, reject) => {
      db.transaction(async (tx) => {
        transactionDb = tx as typeof db;

        // Create a promise that will be resolved when commit/rollback is called
        const controlPromise = new Promise<void>((resolveControl, rejectControl) => {
          commitFn = resolveControl;
          rollbackFn = rejectControl;
        });

        // Notify that transaction is ready
        resolve(transactionDb);

        // Wait for manual commit or rollback
        await controlPromise;
      }).catch(reject);
    });

    // Wait for transaction to be ready
    const tx = await transactionPromise;

    return {
      tx,
      commit: async () => {
        if (commitFn) {
          commitFn();
        }
      },
      rollback: async () => {
        if (rollbackFn) {
          rollbackFn(new Error('Transaction rolled back manually'));
        }
      },
    };
  } catch (error) {
    throw new TransactionError(
      'Failed to begin transaction',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
