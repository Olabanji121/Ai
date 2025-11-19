# Tasks: Add Database Module

## 1. Project Setup & Dependencies

- [ ] 1.1 Install Drizzle ORM packages
  ```bash
  pnpm add drizzle-orm postgres
  pnpm add -D drizzle-kit
  ```
  **Verify:** Check `package.json` includes all packages

- [ ] 1.2 Create `drizzle.config.ts` in project root
  - Configure schema path: `./src/lib/db/schema`
  - Configure output path: `./src/lib/db/migrations`
  - Set dialect to `postgresql`
  - Use `DATABASE_URL` from environment
  **Verify:** Run `pnpm drizzle-kit --help` successfully

- [ ] 1.3 Create directory structure
  ```
  src/lib/db/
  ├── schema/
  ├── repositories/
  ├── migrations/
  └── types/
  ```
  **Verify:** All directories exist with `ls -la src/lib/db/`

- [ ] 1.4 Add DATABASE_URL to `.env.local` (example)
  ```
  DATABASE_URL=postgresql://user:pass@localhost:5432/automarketeer
  ```
  **Verify:** File exists but don't commit it

---

## 2. Core Database Client

- [ ] 2.1 Create `src/lib/db/client.ts`
  - Import `drizzle` from `drizzle-orm/postgres-js`
  - Import `postgres` driver
  - Configure connection pool (max 10, idle timeout 30s)
  - Export configured database client
  **Verify:** File exports `db` instance

- [ ] 2.2 Create custom error classes in `src/lib/db/errors.ts`
  - `DatabaseError` - Base error class
  - `ConnectionError` - Connection failures
  - `QueryError` - Query execution failures
  **Verify:** All error classes extend Error properly

- [ ] 2.3 Add health check method to `src/lib/db/index.ts`
  - Implement `healthCheck()` function
  - Execute simple SELECT 1 query
  - Return boolean (true/false)
  - Add timeout of 5 seconds
  **Verify:** Function returns true with valid connection

- [ ] 2.4 Export main database client from `src/lib/db/index.ts`
  - Re-export `db` from `./client`
  - Re-export all error classes
  - Re-export health check function
  **Verify:** Import works: `import { db } from '@/lib/db'`

---

## 3. Schema Definitions

- [ ] 3.1 Create trends schema in `src/lib/db/schema/trends.ts`
  - Define `trends` table with all columns from spec:
    - `id` (uuid, primary key, default random)
    - `title` (text, not null)
    - `hook` (text, not null)
    - `source` (text, not null)
    - `sourceUrl` (text, nullable)
    - `score` (real, not null)
    - `sentiment` (text, nullable)
    - `category` (text, nullable)
    - `metadata` (jsonb, nullable)
    - `discoveredAt` (timestamp with timezone, default now)
    - `status` (text, default 'new')
    - `embedding` (vector 1536, nullable)
    - `usedForContent` (boolean, default false)
    - `expiresAt` (timestamp with timezone, nullable)
    - `createdAt` (timestamp with timezone, default now)
    - `updatedAt` (timestamp with timezone, default now)
  - Add indexes on: score, status, source, discoveredAt
  - Export inferred types: `Trend`, `NewTrend`
  **Verify:** Types are inferred correctly in IDE

- [ ] 3.2 Create posts schema in `src/lib/db/schema/posts.ts`
  - Define `posts` table with all columns:
    - `id` (uuid, primary key, default random)
    - `trendId` (uuid, foreign key to trends.id, set null on delete)
    - `platform` (text, not null)
    - `content` (text, not null)
    - `mediaUrls` (text array, nullable)
    - `hashtags` (text array, nullable)
    - `tone` (text, nullable)
    - `status` (text, default 'draft')
    - `qualityScore` (real, nullable)
    - `scheduledFor` (timestamp with timezone, nullable)
    - `publishedAt` (timestamp with timezone, nullable)
    - `externalPostId` (text, nullable)
    - `failureReason` (text, nullable)
    - `createdBy` (uuid, nullable)
    - `reviewedBy` (uuid, nullable)
    - `reviewedAt` (timestamp with timezone, nullable)
    - `createdAt` (timestamp with timezone, default now)
    - `updatedAt` (timestamp with timezone, default now)
  - Add indexes on: status, platform, scheduledFor, trendId
  - Export types: `Post`, `NewPost`
  **Verify:** Foreign key relationship to trends works

- [ ] 3.3 Create post variations schema in `src/lib/db/schema/post-variations.ts`
  - Define `post_variations` table:
    - `id` (uuid, primary key, default random)
    - `postId` (uuid, foreign key to posts.id, cascade delete)
    - `variationNumber` (integer, not null)
    - `content` (text, not null)
    - `reasoning` (text, nullable)
    - `selected` (boolean, default false)
    - `createdAt` (timestamp with timezone, default now)
  - Export types: `PostVariation`, `NewPostVariation`
  **Verify:** Cascade delete relationship works

- [ ] 3.4 Create analytics schema in `src/lib/db/schema/analytics.ts`
  - Define `analytics` table:
    - `id` (uuid, primary key, default random)
    - `postId` (uuid, foreign key to posts.id, cascade delete)
    - `platform` (text, not null)
    - `likes` (integer, default 0)
    - `comments` (integer, default 0)
    - `shares` (integer, default 0)
    - `impressions` (integer, default 0)
    - `clicks` (integer, default 0)
    - `ctr` (real, nullable)
    - `engagementRate` (real, nullable)
    - `reachRate` (real, nullable)
    - `fetchedAt` (timestamp with timezone, default now)
    - `rawData` (jsonb, nullable)
  - Export types: `Analytics`, `NewAnalytics`
  **Verify:** Numeric types are correct

- [ ] 3.5 Create user settings schema in `src/lib/db/schema/user-settings.ts`
  - Define `user_settings` table:
    - `userId` (uuid, primary key)
    - `brandVoice` (text, nullable)
    - `postingSchedule` (jsonb, nullable)
    - `tonePreferences` (jsonb, nullable)
    - `contentGuidelines` (jsonb, nullable)
    - `targetAudience` (text, nullable)
    - `platforms` (text array, nullable)
    - `autoPublish` (boolean, default false)
    - `notificationPreferences` (jsonb, nullable)
    - `createdAt` (timestamp with timezone, default now)
    - `updatedAt` (timestamp with timezone, default now)
  - Export types: `UserSettings`, `NewUserSettings`
  **Verify:** JSONB fields accept objects

- [ ] 3.6 Create workflow runs schema in `src/lib/db/schema/workflow-runs.ts`
  - Define `workflow_runs` table:
    - `id` (uuid, primary key, default random)
    - `workflowName` (text, not null)
    - `status` (text, not null)
    - `startedAt` (timestamp with timezone, default now)
    - `completedAt` (timestamp with timezone, nullable)
    - `duration` (integer, nullable)
    - `input` (jsonb, nullable)
    - `output` (jsonb, nullable)
    - `error` (text, nullable)
    - `metadata` (jsonb, nullable)
  - Export types: `WorkflowRun`, `NewWorkflowRun`
  **Verify:** All fields have correct types

- [ ] 3.7 Create central schema export in `src/lib/db/schema/index.ts`
  - Export all schemas (trends, posts, etc.)
  - Export all types
  **Verify:** Can import everything from `@/lib/db/schema`

---

## 4. Repository Implementations

- [ ] 4.1 Create base repository interface in `src/lib/db/repositories/base.repository.ts`
  - Define generic `Repository<T>` interface
  - Methods: `create`, `findById`, `findAll`, `update`, `delete`
  - Generic filter type support
  **Verify:** Interface compiles with TypeScript

- [ ] 4.2 Create TrendRepository in `src/lib/db/repositories/trend.repository.ts`
  - Implement all base repository methods
  - Add `findAll` with filters: status, source, category, minScore
  - Support pagination (limit, offset)
  - Default limit: 50, max limit: 100
  **Verify:** All methods return properly typed results

- [ ] 4.3 Create PostRepository in `src/lib/db/repositories/post.repository.ts`
  - Implement all base repository methods
  - Add `findAll` with filters: status, platform, trendId
  - Add `findWithTrend` method (joins trends table)
  - Support date range filters (scheduledFor)
  **Verify:** Join query returns post with nested trend

- [ ] 4.4 Create AnalyticsRepository in `src/lib/db/repositories/analytics.repository.ts`
  - Implement `create`, `findByPostId`
  - Add `findByDateRange(from, to)` method
  - Add aggregation methods for metrics
  - Calculate derived fields (engagementRate, ctr)
  **Verify:** Aggregations return correct numbers

- [ ] 4.5 Create UserSettingsRepository in `src/lib/db/repositories/user-settings.repository.ts`
  - Implement `findByUserId`, `upsert`
  - Handle JSONB fields properly
  - Validate JSONB structure with zod schemas
  **Verify:** JSONB updates preserve structure

- [ ] 4.6 Create WorkflowRunRepository in `src/lib/db/repositories/workflow.repository.ts`
  - Implement `create`, `findById`, `updateStatus`
  - Add `findByWorkflowName` filter
  - Add `findActive` (status = 'running')
  **Verify:** Status updates work correctly

- [ ] 4.7 Export all repositories from `src/lib/db/repositories/index.ts`
  - Create singleton instances of each repository
  - Export instances: `trendRepository`, `postRepository`, etc.
  **Verify:** Import works: `import { trendRepository } from '@/lib/db/repositories'`

---

## 5. Transaction Support

- [ ] 5.1 Add transaction wrapper to database client
  - Implement `transaction<T>(callback)` method
  - Auto-commit on success
  - Auto-rollback on error
  - Re-throw original error
  **Verify:** Successful transaction commits changes

- [ ] 5.2 Add manual transaction support
  - Implement `beginTransaction()` method
  - Return transaction object with `commit()`, `rollback()`
  - Add timeout handling
  **Verify:** Manual rollback undoes changes

- [ ] 5.3 Test nested transactions
  - Implement savepoint support for nested transactions
  - Nested rollback only rolls back to savepoint
  - Outer transaction remains active
  **Verify:** Nested rollback doesn't affect outer transaction

---

## 6. Migrations

- [ ] 6.1 Generate initial migration
  ```bash
  pnpm drizzle-kit generate
  ```
  - Review generated SQL in `migrations/`
  - Ensure all tables, indexes, foreign keys are correct
  **Verify:** Migration SQL looks correct

- [ ] 6.2 Add pgvector extension to migration
  - Manually edit migration to add `CREATE EXTENSION IF NOT EXISTS vector;`
  - Ensure extension is created before tables
  **Verify:** Extension creation is in migration

- [ ] 6.3 Apply migration to database
  ```bash
  pnpm drizzle-kit migrate
  ```
  - Connect to database and run migrations
  **Verify:** All tables exist in database

- [ ] 6.4 Create migration helper scripts in `package.json`
  ```json
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio"
  ```
  **Verify:** Scripts run correctly

---

## 7. Testing

- [ ] 7.1 Create test database setup in `src/lib/db/__tests__/setup.ts`
  - Use Docker PostgreSQL for tests
  - Run migrations before tests
  - Clear database between tests
  **Verify:** Test database is isolated

- [ ] 7.2 Write database client tests in `src/lib/db/__tests__/client.test.ts`
  - Test successful connection
  - Test connection failure handling
  - Test health check
  - Test graceful shutdown
  **Verify:** All tests pass

- [ ] 7.3 Write TrendRepository tests in `src/lib/db/repositories/__tests__/trend.repository.test.ts`
  - Test create, findById, findAll, update, delete
  - Test filters (status, source, category, minScore)
  - Test pagination
  - Test limit enforcement
  **Verify:** 90%+ code coverage for repository

- [ ] 7.4 Write PostRepository tests
  - Test all CRUD operations
  - Test findWithTrend join query
  - Test date range filters
  **Verify:** 90%+ code coverage

- [ ] 7.5 Write AnalyticsRepository tests
  - Test metric calculations
  - Test aggregation queries
  - Test date range queries
  **Verify:** Calculations are accurate

- [ ] 7.6 Write transaction tests in `src/lib/db/__tests__/transactions.test.ts`
  - Test successful commit
  - Test automatic rollback on error
  - Test manual transaction
  - Test nested transactions
  **Verify:** All transaction scenarios work

- [ ] 7.7 Run all tests with coverage
  ```bash
  pnpm test src/lib/db
  pnpm test:coverage src/lib/db
  ```
  **Verify:** 90%+ test coverage achieved

---

## 8. Documentation

- [ ] 8.1 Add JSDoc comments to all repository methods
  - Document parameters
  - Document return types
  - Document error cases
  **Verify:** IDE shows documentation on hover

- [ ] 8.2 Create `src/lib/db/README.md` with usage examples
  - Basic usage of repositories
  - Transaction examples
  - Migration workflow
  - Testing guidelines
  **Verify:** Examples are clear and runnable

- [ ] 8.3 Update project documentation
  - Add database setup instructions to main README
  - Document environment variables needed
  - Explain migration process
  **Verify:** Documentation is complete

---

## 9. Validation & Quality Checks

- [ ] 9.1 Run TypeScript type checking
  ```bash
  pnpm tsc --noEmit
  ```
  **Verify:** No type errors

- [ ] 9.2 Run linter
  ```bash
  pnpm lint
  ```
  **Verify:** No linting errors

- [ ] 9.3 Run formatter
  ```bash
  pnpm format
  ```
  **Verify:** All files formatted consistently

- [ ] 9.4 Validate OpenSpec change
  ```bash
  openspec validate add-database-module --strict
  ```
  **Verify:** No validation errors

---

## Dependencies

- Task 2 depends on Task 1 (need packages installed)
- Task 3 depends on Task 2 (need client setup)
- Task 4 depends on Task 3 (need schemas defined)
- Task 5 depends on Task 2 (uses database client)
- Task 6 depends on Task 3 (need schemas for migrations)
- Task 7 depends on Tasks 2-6 (test everything)
- Task 8 depends on Tasks 2-6 (document implementation)
- Task 9 depends on all previous tasks (final validation)

## Parallelizable Work

After schemas are defined (Task 3):
- Repositories (Task 4) and Transactions (Task 5) can be built in parallel
- Tests (Task 7) can be written as implementations are completed

## Estimated Duration

- Tasks 1-3: 4-6 hours (setup + schemas)
- Tasks 4-5: 6-8 hours (repositories + transactions)
- Task 6: 1-2 hours (migrations)
- Task 7: 4-6 hours (comprehensive testing)
- Tasks 8-9: 2-3 hours (docs + validation)

**Total: 17-25 hours (2-3 days)**
