/**
 * Base Repository Interface
 *
 * Defines the standard CRUD operations that all repositories should implement.
 * This ensures consistency across all data access patterns.
 *
 * @template T - The entity type (e.g., Trend, Post)
 * @template CreateT - The type for creating new entities (e.g., NewTrend, NewPost)
 * @template UpdateT - The type for updating entities
 * @template FilterT - The type for filtering queries
 */
export interface BaseRepository<T, CreateT, UpdateT, FilterT = {}> {
  /**
   * Create a new entity
   *
   * @param data - The data for the new entity
   * @returns The created entity with generated ID
   */
  create(data: CreateT): Promise<T>;

  /**
   * Find an entity by its ID
   *
   * @param id - The UUID of the entity
   * @returns The entity if found, null otherwise
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities matching the given filters
   *
   * @param filters - Optional filters to apply
   * @returns Array of matching entities
   */
  findAll(filters?: FilterT): Promise<T[]>;

  /**
   * Update an entity by its ID
   *
   * @param id - The UUID of the entity to update
   * @param data - The fields to update
   * @returns The updated entity
   */
  update(id: string, data: UpdateT): Promise<T>;

  /**
   * Delete an entity by its ID
   *
   * @param id - The UUID of the entity to delete
   * @returns void
   */
  delete(id: string): Promise<void>;

  /**
   * Count entities matching the given filters
   *
   * @param filters - Optional filters to apply
   * @returns The count of matching entities
   */
  count(filters?: FilterT): Promise<number>;
}

/**
 * Pagination options for repository queries
 */
export interface PaginationOptions {
  limit?: number; // Default 50, max 100
  offset?: number; // Default 0
}

/**
 * Sort options for repository queries
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Apply pagination to a query
 * Ensures limit doesn't exceed 100 and defaults to 50
 */
export function applyPagination(filters?: { limit?: number; offset?: number }) {
  const limit = Math.min(filters?.limit || 50, 100);
  const offset = filters?.offset || 0;
  return { limit, offset };
}
