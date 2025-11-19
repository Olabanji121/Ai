/**
 * Repository Index
 *
 * Central export for all database repositories.
 * Import repositories from here to access type-safe data operations.
 *
 * @example
 * ```typescript
 * import { trendRepository, postRepository } from '@/lib/db/repositories';
 *
 * // Use repositories
 * const trends = await trendRepository.findAll({ status: 'new' });
 * const post = await postRepository.findById(postId);
 * ```
 */

// Export base repository interface
export * from './base.repository';

// Export repository instances
export { trendRepository } from './trend.repository';
export { postRepository } from './post.repository';
export { analyticsRepository } from './analytics.repository';
export { userSettingsRepository } from './user-settings.repository';
export { workflowRunRepository } from './workflow.repository';
