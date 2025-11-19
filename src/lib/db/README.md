# Database Module

The database module provides a type-safe, testable data access layer for AutoMarketeer using [Drizzle ORM](https://orm.drizzle.team/) and PostgreSQL.

## Features

- 🔒 **Type-safe queries** with full TypeScript inference
- 🏗️ **Repository pattern** for clean separation of concerns
- 🔄 **Transaction support** with automatic rollback on errors
- 📊 **Connection pooling** with configurable limits
- 🧪 **Comprehensive testing** with Vitest
- 🔍 **Schema migrations** with Drizzle Kit
- ⚡ **Optimized queries** with strategic indexing

## Quick Start

### Installation

Dependencies are already installed. Ensure your `.env.local` has:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/automarketeer
```

### Basic Usage

```typescript
import { db, trendRepository, postRepository } from '@/lib/db';

// Create a trend
const trend = await trendRepository.create({
  title: 'AI Revolution in Marketing',
  hook: 'How AI is transforming digital marketing in 2025',
  source: 'reddit',
  sourceUrl: 'https://reddit.com/r/marketing/comments/abc123',
  score: 92.5,
  sentiment: 'positive',
  category: 'technology',
});

// Find top trends
const topTrends = await trendRepository.findTopTrends(10);

// Create a post from a trend
const post = await postRepository.create({
  trendId: trend.id,
  platform: 'twitter',
  content: 'Check out this amazing AI trend! #AI #Marketing',
  hashtags: ['AI', 'Marketing'],
  tone: 'professional',
  status: 'draft',
});
```

## Architecture

### Database Client

The core database client (`src/lib/db/client.ts`) provides:

- PostgreSQL connection with optimized pooling
- Health check functionality
- Graceful disconnect
- Transaction management

```typescript
import { db, healthCheck, disconnect, transaction } from '@/lib/db/client';

// Check database health
const isHealthy = await healthCheck();

// Use transactions
await transaction(async (tx) => {
  const trend = await tx.insert(trends).values(data).returning();
  const post = await tx.insert(posts).values({ trendId: trend.id }).returning();
  return { trend, post };
});

// Graceful shutdown
await disconnect();
```

### Repositories

Repositories provide a clean interface for data access:

#### TrendRepository

Manages viral trend data from Reddit, Twitter, and Google Trends.

```typescript
import { trendRepository } from '@/lib/db/repositories';

// Find trends with filters
const redditTrends = await trendRepository.findAll({
  source: 'reddit',
  minScore: 80,
  status: 'new',
  limit: 20,
});

// Get top trending topics
const topTrends = await trendRepository.findTopTrends(10);

// Mark trend as used
await trendRepository.markAsUsed(trend.id);
```

#### PostRepository

Manages social media posts with status workflows.

```typescript
import { postRepository } from '@/lib/db/repositories';

// Create a draft post
const post = await postRepository.create({
  platform: 'twitter',
  content: 'Amazing content here!',
  status: 'draft',
});

// Approve post for publishing
await postRepository.approve(post.id, userId, scheduledDate);

// Publish post
await postRepository.markPublished(post.id, 'twitter_123456');

// Find post with associated trend
const postWithTrend = await postRepository.findByIdWithTrend(post.id);
```

#### AnalyticsRepository

Tracks post performance with automatic metric calculations.

```typescript
import { analyticsRepository } from '@/lib/db/repositories';

// Create analytics (auto-calculates CTR and engagement rate)
const analytics = await analyticsRepository.create({
  postId: post.id,
  platform: 'twitter',
  likes: 150,
  comments: 25,
  shares: 10,
  impressions: 5000,
  clicks: 250,
});

// Get aggregated metrics by platform
const stats = await analyticsRepository.getAggregateByPlatform(
  'twitter',
  new Date('2025-01-01'),
  new Date('2025-01-31')
);

// Calculate performance score (0-100)
const score = analyticsRepository.calculatePerformanceScore(analytics);
```

#### UserSettingsRepository

Manages user preferences and configuration.

```typescript
import { userSettingsRepository } from '@/lib/db/repositories';

// Upsert user settings
const settings = await userSettingsRepository.upsert({
  userId: user.id,
  brandVoice: 'Professional and approachable',
  platforms: ['twitter', 'linkedin'],
  autoPublish: false,
});

// Update specific settings
await userSettingsRepository.updateBrandVoice(userId, 'Casual and friendly');
await userSettingsRepository.setAutoPublish(userId, true);
```

#### WorkflowRunRepository

Tracks Mastra workflow executions.

```typescript
import { workflowRunRepository } from '@/lib/db/repositories';

// Create workflow run
const run = await workflowRunRepository.create({
  workflowName: 'trend-discovery',
  status: 'running',
  input: { source: 'reddit', limit: 100 },
});

// Update status
await workflowRunRepository.updateStatus(run.id, 'completed');

// Get workflow statistics
const stats = await workflowRunRepository.getWorkflowStats('trend-discovery');
```

## Schemas

All database schemas are defined in `src/lib/db/schema/` with full TypeScript types:

- `trends.ts` - Viral trends with embeddings support
- `posts.ts` - Social media posts
- `post-variations.ts` - A/B testing variations
- `analytics.ts` - Performance metrics
- `user-settings.ts` - User preferences
- `workflow-runs.ts` - Workflow execution history

## Transactions

### Callback-based (Recommended)

Automatically commits on success, rolls back on error:

```typescript
import { transaction } from '@/lib/db';

const result = await transaction(async (tx) => {
  // Create trend
  const [trend] = await tx.insert(trends).values(trendData).returning();

  // Create multiple posts
  const postPromises = platforms.map((platform) =>
    tx.insert(posts).values({ trendId: trend.id, platform }).returning()
  );
  const createdPosts = await Promise.all(postPromises);

  return { trend, posts: createdPosts };
});
```

### Manual Control

For advanced use cases requiring explicit control:

```typescript
import { beginTransaction } from '@/lib/db';

const { tx, commit, rollback } = await beginTransaction();

try {
  const [trend] = await tx.insert(trends).values(data).returning();
  const [post] = await tx.insert(posts).values({ trendId: trend.id }).returning();

  await commit();
} catch (error) {
  await rollback();
  throw error;
}
```

## Migrations

Migrations are managed with Drizzle Kit:

```bash
# Generate migration from schema changes
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema directly (development only)
pnpm db:push

# Open Drizzle Studio (visual database browser)
pnpm db:studio

# Drop migrations (dangerous!)
pnpm db:drop
```

### Creating Migrations

1. Update schema files in `src/lib/db/schema/`
2. Run `pnpm db:generate` to create migration
3. Review generated SQL in `src/lib/db/migrations/`
4. Run `pnpm db:migrate` to apply

## Error Handling

The module provides custom error classes for better error handling:

```typescript
import {
  DatabaseError,
  ConnectionError,
  QueryError,
  TransactionError,
  MigrationError,
} from '@/lib/db/errors';

try {
  await trendRepository.create(data);
} catch (error) {
  if (error instanceof QueryError) {
    console.error('Query failed:', error.query);
    console.error('Parameters:', error.params);
    console.error('Cause:', error.cause);
  } else if (error instanceof ConnectionError) {
    console.error('Connection failed to:', error.host, error.port);
  }
}
```

## Testing

Tests use Vitest with comprehensive coverage:

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

Test files are located in `__tests__` directories alongside the code:

- `src/lib/db/__tests__/client.test.ts` - Database client tests
- `src/lib/db/__tests__/transactions.test.ts` - Transaction tests
- `src/lib/db/repositories/__tests__/*.test.ts` - Repository tests

## Configuration

### Connection Pool

Connection pooling is configured in `src/lib/db/client.ts`:

```typescript
const connectionConfig = {
  max: 10, // Maximum connections
  idle_timeout: 30, // 30 seconds
  connect_timeout: 10, // 10 seconds
  statement_timeout: 30000, // 30 seconds (30000ms)
  prepare: false, // Disable prepared statements for better compatibility
};
```

### Drizzle Configuration

Drizzle Kit is configured in `drizzle.config.ts`:

```typescript
export default {
  schema: './src/lib/db/schema/index.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
};
```

## Best Practices

### 1. Use Repositories

Always access data through repositories, not the raw `db` client:

```typescript
// ❌ Don't do this
const trends = await db.select().from(trends).where(eq(trends.status, 'new'));

// ✅ Do this
const trends = await trendRepository.findAll({ status: 'new' });
```

### 2. Use Transactions for Related Operations

```typescript
// ✅ Create trend and posts atomically
await transaction(async (tx) => {
  const trend = await trendRepository.create(trendData);
  await postRepository.create({ trendId: trend.id, ...postData });
});
```

### 3. Handle Errors Appropriately

```typescript
try {
  const trend = await trendRepository.findById(id);
} catch (error) {
  if (error instanceof QueryError) {
    // Log for debugging
    logger.error('Query error', { query: error.query, cause: error.cause });
  }
  throw error; // Re-throw or handle gracefully
}
```

### 4. Use Type Inference

Leverage Drizzle's type inference for compile-time safety:

```typescript
import type { Trend, NewTrend, UpdateTrend } from '@/lib/db/schema/trends';

const newTrend: NewTrend = {
  title: 'Test',
  hook: 'Test hook',
  source: 'reddit',
  score: 50,
};
```

### 5. Implement Pagination

Always paginate large result sets:

```typescript
const trends = await trendRepository.findAll({
  status: 'new',
  limit: 50, // Default is 50, max is 100
  offset: 0,
});
```

## Performance Tips

### Indexing

The module includes strategic indexes for common queries:

- `idx_trends_score` - For sorting by virality score
- `idx_trends_status` - For filtering by status
- `idx_trends_source` - For filtering by source
- `idx_posts_platform` - For filtering by platform
- `idx_posts_scheduled_for` - For finding scheduled posts

### Eager Loading

Use joins to avoid N+1 queries:

```typescript
// ✅ One query with join
const postWithTrend = await postRepository.findByIdWithTrend(postId);

// ❌ Two queries (N+1 problem)
const post = await postRepository.findById(postId);
const trend = await trendRepository.findById(post.trendId);
```

### Batch Operations

Use transactions for batch operations:

```typescript
await transaction(async (tx) => {
  const promises = items.map((item) => tx.insert(trends).values(item));
  await Promise.all(promises);
});
```

## Troubleshooting

### Connection Issues

```typescript
// Check database health
const isHealthy = await healthCheck();
if (!isHealthy) {
  console.error('Database is not responding');
}

// Get pool statistics
const stats = getPoolStats();
console.log('Pool config:', stats);
```

### Migration Issues

```bash
# Check current migration status
pnpm db:studio

# If migrations are out of sync, generate new one
pnpm db:generate

# Force push schema (development only - will drop data!)
pnpm db:push
```

### Query Performance

Enable query logging in development:

```typescript
import { db } from '@/lib/db';

// Drizzle logs queries in development mode
// Check console for slow queries
```

## API Reference

For detailed API documentation, see:

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- JSDoc comments in source files

## Contributing

When adding new tables or repositories:

1. Define schema in `src/lib/db/schema/`
2. Export schema types (`$inferSelect`, `$inferInsert`)
3. Create repository in `src/lib/db/repositories/`
4. Export repository from `src/lib/db/repositories/index.ts`
5. Add tests in `__tests__/` directory
6. Generate and run migration
7. Update this README

## License

Part of the AutoMarketeer project.
