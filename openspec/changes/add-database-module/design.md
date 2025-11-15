# Design: Database Module Architecture

## Overview

The Database Module provides a type-safe abstraction layer over PostgreSQL using Drizzle ORM and the Repository pattern. This design ensures consistency, testability, and maintainability across all data access.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│           Application Layer (Services)              │
└───────────────────┬─────────────────────────────────┘
                    │ uses
        ┌───────────▼──────────────┐
        │   Repository Interface   │
        │  (TrendRepository, etc.) │
        └───────────┬──────────────┘
                    │ implements
        ┌───────────▼──────────────┐
        │  Repository Implementation│
        │  (Drizzle ORM queries)   │
        └───────────┬──────────────┘
                    │ uses
        ┌───────────▼──────────────┐
        │   Database Client        │
        │  (Connection Pool)       │
        └───────────┬──────────────┘
                    │
        ┌───────────▼──────────────┐
        │      PostgreSQL          │
        │      (Supabase)          │
        └──────────────────────────┘
```

## Design Decisions

### 1. Why Drizzle ORM?

**Options Considered:**
- Prisma - Feature-rich but adds schema proxy layer
- TypeORM - Mature but decorator-heavy syntax
- Drizzle ORM - Lightweight, type-safe, SQL-like

**Decision: Drizzle ORM**

**Rationale:**
- Full TypeScript type inference without code generation
- SQL-like syntax (easy to optimize)
- Lightweight runtime (~10kb)
- Native support for Postgres features (pgvector)
- No schema proxy - direct SQL generation
- Excellent migration system

**Trade-offs:**
- Less mature ecosystem than Prisma
- Fewer community plugins
- Manual relationship handling

### 2. Repository Pattern

**Alternatives:**
- Active Record (models have database methods)
- Data Mapper (separate data and domain logic)
- Query Builder (direct SQL building)
- Repository Pattern (encapsulate data access)

**Decision: Repository Pattern**

**Rationale:**
- Clean separation of concerns
- Easy to mock in tests
- Centralized data access logic
- Consistent API across entities
- Can switch ORM without changing service code

**Trade-offs:**
- More boilerplate code
- Additional abstraction layer
- Need to maintain repository interfaces

### 3. Connection Pooling

**Configuration:**
- Max Connections: 10 (per project.md)
- Idle Timeout: 30 seconds
- Connection Timeout: 10 seconds
- Statement Timeout: 30 seconds (per project.md)

**Rationale:**
- Prevents connection exhaustion
- Reuses connections for performance
- Handles connection failures gracefully

### 4. Schema Organization

**Structure:**
```
src/lib/db/
├── index.ts              # DB client export
├── client.ts             # Connection setup
├── schema/               # Schema definitions
│   ├── index.ts          # Export all schemas
│   ├── trends.ts         # Trends table
│   ├── posts.ts          # Posts & variations
│   ├── analytics.ts      # Analytics data
│   ├── users.ts          # User settings
│   └── workflows.ts      # Workflow runs
├── repositories/         # Repository implementations
│   ├── index.ts          # Export all repos
│   ├── trend.repository.ts
│   ├── post.repository.ts
│   ├── analytics.repository.ts
│   ├── user-settings.repository.ts
│   └── workflow.repository.ts
└── migrations/           # Drizzle migrations
    └── 0000_initial.sql
```

**Rationale:**
- Logical grouping by entity
- Easy to find and modify schemas
- Migrations separate from code
- Repositories co-located with schemas

### 5. Transaction Management

**API Design:**
```typescript
// Method 1: Callback-based (recommended)
await db.transaction(async (tx) => {
  await tx.insert(trends).values(data);
  await tx.insert(posts).values(postData);
  // Auto-commit on success, rollback on error
});

// Method 2: Manual (advanced use cases)
const tx = await db.beginTransaction();
try {
  await tx.insert(trends).values(data);
  await tx.commit();
} catch (error) {
  await tx.rollback();
  throw error;
}
```

**Rationale:**
- Callback pattern is safer (auto-rollback)
- Manual pattern for complex scenarios
- Explicit transaction boundaries

### 6. Error Handling

**Custom Error Classes:**
```typescript
class DatabaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

class ConnectionError extends DatabaseError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'ConnectionError';
  }
}

class QueryError extends DatabaseError {
  constructor(message: string, public query?: string, cause?: Error) {
    super(message, cause);
    this.name = 'QueryError';
  }
}
```

**Rationale:**
- Clear error classification
- Preserve original error for debugging
- Easy to handle specific error types

### 7. Type Safety

**Approach:**
```typescript
// 1. Define schema with Drizzle
export const trends = pgTable('trends', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  score: real('score').notNull(),
  // ...
});

// 2. Infer types
export type Trend = typeof trends.$inferSelect;
export type NewTrend = typeof trends.$inferInsert;

// 3. Use in repositories
class TrendRepository {
  async create(data: NewTrend): Promise<Trend> {
    // Type-safe insert
  }
}
```

**Rationale:**
- Single source of truth (schema)
- No manual type definitions
- Compile-time safety
- Auto-complete in IDEs

## Performance Considerations

### Query Optimization
- Use indexes on frequently queried columns
- Limit result sets (default 50, max 100)
- Use pagination for large datasets
- Avoid N+1 queries with joins

### Connection Management
- Connection pool prevents exhaustion
- Idle connections released after 30s
- Health checks detect dead connections
- Graceful shutdown on app termination

### Caching Strategy
- Database module doesn't implement caching
- Cache Module (Layer 1) will wrap repositories
- Separation of concerns maintained

## Security

### SQL Injection Prevention
- All queries use parameterized statements
- Drizzle ORM escapes values automatically
- No string concatenation for queries

### Connection Security
- SSL/TLS enforced for production
- Connection string in environment variable
- No hardcoded credentials

### Access Control
- Database-level permissions (Supabase RLS)
- Application-level authorization (separate concern)

## Testing Strategy

### Unit Tests
- Mock database connection
- Test repository methods in isolation
- Verify query construction
- Test error handling

### Integration Tests
- Use test database (Docker container)
- Run migrations before tests
- Clean database between tests
- Test transactions and rollbacks

### Test Data
- Factories for creating test entities
- Seed scripts for development
- Fixtures for consistent test scenarios

## Migration Strategy

### Schema Changes
```bash
# 1. Modify schema in code
# 2. Generate migration
pnpm drizzle-kit generate

# 3. Review generated SQL
# 4. Apply migration
pnpm drizzle-kit migrate

# 5. Commit schema + migration
```

### Rollback Plan
- Keep old migrations for rollback
- Test rollbacks in staging
- Document breaking changes

## Monitoring & Observability

### Metrics to Track
- Connection pool usage
- Query execution time
- Error rates by type
- Slow queries (>100ms)

### Logging
- Log all queries in development
- Log errors with context
- Log connection events (open/close)
- Use structured logging (JSON)

## Open Questions

None - design is clear based on project.md requirements.

## Future Enhancements

**Phase 2 (Performance):**
- Query result caching
- Read replicas for scalability
- Connection pooling per-tenant

**Phase 3 (Advanced):**
- Database sharding
- Real-time subscriptions (Supabase)
- Event sourcing for audit trails

## Alternatives Considered

### Alternative 1: Direct Supabase Client
**Pros:** Simpler, fewer abstractions
**Cons:** Less type-safe, harder to test, vendor lock-in
**Decision:** Rejected - need flexibility and testability

### Alternative 2: Prisma ORM
**Pros:** Mature, great tooling, migrations
**Cons:** Schema proxy layer, slower, larger runtime
**Decision:** Rejected - Drizzle is lighter and more SQL-like

### Alternative 3: Raw SQL
**Pros:** Maximum control, no ORM overhead
**Cons:** No type safety, manual migrations, boilerplate
**Decision:** Rejected - type safety is critical
