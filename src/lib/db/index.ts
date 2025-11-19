/**
 * Database Module - Main Export
 *
 * This module provides a centralized database layer with:
 * - Type-safe database client (Drizzle ORM)
 * - Connection pooling and health checks
 * - Repository pattern for data access
 * - Custom error handling
 * - Transaction support
 *
 * Usage:
 * ```typescript
 * import { db, healthCheck } from '@/lib/db';
 * import { trendRepository } from '@/lib/db/repositories';
 *
 * // Check database health
 * const isHealthy = await healthCheck();
 *
 * // Use repositories
 * const trends = await trendRepository.findAll({ status: 'new' });
 * ```
 */

// Re-export database client and utilities
export { db, healthCheck, disconnect, getClient, getPoolStats } from './client';

// Re-export error classes
export {
  DatabaseError,
  ConnectionError,
  QueryError,
  TransactionError,
  MigrationError,
} from './errors';

// Re-export schemas (will be populated as schemas are added)
export * from './schema';

// Re-export repositories (will be populated as repositories are added)
// export * from './repositories';
