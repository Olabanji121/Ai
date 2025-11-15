# Proposal: Add Database Module with Repository Pattern

## Context

AutoMarketeer requires a robust database layer to manage:
- Trends discovered from various sources
- Generated content posts across platforms
- Analytics and performance metrics
- User settings and preferences
- Workflow execution state
- Agent memory for AI learning

Currently, there is no database infrastructure in place. This is the **first Layer 1 Core Module** in our 3-layer architecture.

## Problem

Without a centralized database module, we cannot:
1. Persist discovered trends or generated content
2. Track workflow execution history
3. Store analytics for performance insights
4. Maintain agent memory for learning
5. Enforce consistent data access patterns
6. Ensure type-safe database operations

## Proposed Solution

Implement a **Database Module** that provides:

### 1. Database Client
- PostgreSQL connection using Drizzle ORM
- Connection pooling (max 10 connections per project.md)
- Health check functionality
- Graceful connection management

### 2. Repository Pattern
Type-safe repositories for each entity:
- `TrendRepository` - Manage trends (create, read, update, delete, filter)
- `PostRepository` - Manage posts and variations
- `AnalyticsRepository` - Store and query analytics data
- `UserSettingsRepository` - User preferences and configuration
- `WorkflowRunRepository` - Workflow execution tracking

### 3. Schema Management
- Drizzle schema definitions with TypeScript types
- Migration system for schema evolution
- Support for pgvector (1536 dimensions for embeddings)

### 4. Transaction Support
- Transaction management for atomic operations
- Rollback capability on failures
- Nested transaction support if needed

### 5. Query Utilities
- Parameterized queries to prevent SQL injection
- Query timeout enforcement (30s per project.md)
- Error handling with custom database errors

## Benefits

1. **Type Safety** - Drizzle provides full TypeScript type inference
2. **Testability** - Repository pattern enables easy mocking in tests
3. **Maintainability** - Centralized data access, no scattered SQL
4. **Performance** - Connection pooling and query optimization
5. **Security** - Parameterized queries prevent SQL injection
6. **Scalability** - Clean abstraction for future optimizations

## Success Criteria

- ✅ Database client connects to PostgreSQL
- ✅ All repositories implement CRUD operations
- ✅ Schema migrations run successfully
- ✅ Connection pooling works correctly
- ✅ Transactions commit and rollback properly
- ✅ 90%+ test coverage
- ✅ No direct SQL queries outside repositories

## Out of Scope

- Database hosting/provisioning (assumes Supabase is setup)
- Query optimization (will address in performance improvements)
- Read replicas or sharding (future enhancement)
- Real-time subscriptions (Supabase feature, not in this module)
- Backup/restore functionality (infrastructure concern)

## Dependencies

**Required:**
- PostgreSQL database (Supabase recommended)
- `DATABASE_URL` environment variable

**npm packages:**
- `drizzle-orm` - ORM
- `postgres` - PostgreSQL driver
- `drizzle-kit` - CLI for migrations

## Timeline

**Estimated:** 2-3 days

**Breakdown:**
- Day 1: Database client + schema setup
- Day 2: Repository implementations + migrations
- Day 3: Testing + documentation

## Questions & Clarifications

None at this time. All requirements are clear from project.md.

## Related Changes

This is the foundation module. Future changes will depend on this:
- Configuration Module (uses database for dynamic config)
- Cache Module (may cache query results)
- All Layer 2 Services (use repositories for data access)
