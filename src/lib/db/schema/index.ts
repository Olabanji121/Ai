/**
 * Central export for all database schemas
 *
 * This file exports all table schemas and their inferred types.
 * Import from here to access any database schema or type.
 *
 * @example
 * ```typescript
 * import { trends, posts, type Trend, type NewPost } from '@/lib/db/schema';
 * ```
 */

// Export all schemas
export * from './trends';
export * from './posts';
export * from './post-variations';
export * from './analytics';
export * from './user-settings';
export * from './workflow-runs';
