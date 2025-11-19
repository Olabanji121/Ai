# Mastra AI Integration

This module provides AI-powered trend discovery, content generation, and optimization for AutoMarketeer using the [Mastra](https://mastra.ai) framework.

## Architecture

```
src/lib/mastra/
├── agents/              # AI agents for specific tasks
├── tools/               # Database integration tools
├── workflows/           # Orchestrated multi-step processes
├── utils/               # Utility functions (retry, error handling, tracking)
├── cron/                # Scheduled workflow execution
└── __tests__/           # Comprehensive test suite
```

## AI Agents

### Trend Discovery Agent
Analyzes multiple sources (Reddit, Twitter, Google Trends) to find viral content opportunities.

```typescript
import { trendDiscoveryAgent } from '@/lib/mastra/agents';

const result = await trendDiscoveryAgent.generate(`
  Analyze trends from reddit, twitter for tech content
`);
```

### Content Generation Agent
Creates platform-optimized social media posts from trends.

```typescript
import { contentGenerationAgent } from '@/lib/mastra/agents';

const result = await contentGenerationAgent.generate(`
  Create posts for: AI Revolution in Marketing
  Platforms: twitter, linkedin
  Brand Voice: Professional and engaging
`);
```

### Content Optimizer Agent
Improves existing content for better engagement and platform fit.

```typescript
import { contentOptimizerAgent } from '@/lib/mastra/agents';

const result = await contentOptimizerAgent.generate(`
  Optimize: "AI is changing everything"
  Target: Higher engagement
  Platform: twitter
`);
```

## Workflows

### Trend Discovery Workflow
Discovers and scores viral trends, stores high-scoring ones in the database.

```typescript
import { runTrendDiscoveryWorkflow } from '@/lib/mastra/workflows';

const { runId, output } = await runTrendDiscoveryWorkflow({
  sources: ['reddit', 'twitter', 'google_trends'],
  minScore: 70,
  maxTrends: 20,
});
```

### Content Generation Workflow
Creates posts from trends with automatic state tracking.

```typescript
import { runContentGenerationWorkflow } from '@/lib/mastra/workflows';

const { runId, output } = await runContentGenerationWorkflow({
  userId: 'user-123',
  trendId: 'trend-uuid',          // Optional - auto-selects if not provided
  platforms: ['twitter', 'linkedin'],
  customInstructions: 'Focus on data visualization',
});
```

## API Routes

### Trigger Workflows

```bash
# Discover trends
POST /api/workflows/trend-discovery
{
  "sources": ["reddit", "twitter"],
  "minScore": 70,
  "maxTrends": 20
}

# Generate content
POST /api/workflows/generate-content
{
  "userId": "user-123",
  "platforms": ["twitter", "linkedin"]
}

# Optimize content
POST /api/workflows/optimize
{
  "content": "Your content here",
  "platform": "twitter",
  "targetMetric": "engagement"
}
```

### Check Workflow Status

```bash
GET /api/workflows/status/{runId}
GET /api/workflows/runs?workflowName=trend-discovery&limit=10
```

## Scheduled Execution

Workflows can be scheduled using cron expressions:

```typescript
import { startScheduler, stopScheduler, getSchedulerStatus } from '@/lib/mastra/cron';

// Start scheduled workflows
startScheduler();

// Check status
const status = getSchedulerStatus();
console.log(`Running: ${status.running}, Active Jobs: ${status.activeJobs}`);

// Stop scheduler
stopScheduler();
```

### Default Schedules
- **Trend Discovery**: Every 6 hours
- **Content Optimization**: Every 24 hours

## Utilities

### Workflow State Tracking

All workflows automatically track their execution state:

```typescript
import { executeWithTracking } from '@/lib/mastra/utils';

const { runId, output } = await executeWithTracking(
  'my-workflow',
  { input: 'data' },
  async (runId) => {
    // Your workflow logic here
    return { result: 'success' };
  }
);
```

### Retry with Backoff

For resilient API calls:

```typescript
import { retryWithBackoff, isTransientError } from '@/lib/mastra/utils';

const result = await retryWithBackoff(
  () => fetchExternalAPI(),
  {
    maxRetries: 3,
    backoffMs: [2000, 4000, 8000],
    isRetryable: isTransientError,
  }
);
```

### Error Handling

Centralized error classification and logging:

```typescript
import { handleError, createErrorResponse } from '@/lib/mastra/utils';

try {
  await riskyOperation();
} catch (error) {
  const classified = handleError(error, { operation: 'risk-op' });
  return createErrorResponse(classified);
}
```

## Configuration

### Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=your-openai-key

# Anthropic Configuration (optional)
ANTHROPIC_API_KEY=your-anthropic-key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

### Model Selection

Agents use GPT-4o by default. To change:

```typescript
// In src/lib/mastra/agents/*.agent.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// Use GPT-4o (default)
model: openai('gpt-4o')

// Or use Claude 3.5 Sonnet
model: anthropic('claude-3-5-sonnet-20241022')
```

## Testing

Run the test suite:

```bash
# Run all Mastra tests
npx vitest run src/lib/mastra/__tests__

# Run with coverage
npx vitest run src/lib/mastra/__tests__ --coverage

# Run specific test file
npx vitest run src/lib/mastra/__tests__/workflows/trend-discovery.workflow.test.ts
```

### Test Coverage
- **113 tests** across 7 test files
- Utility tests (retry, error-handler, workflow-tracking)
- Workflow tests (trend-discovery, content-generation)
- Cron scheduler tests
- Agent tests with mocked LLM responses

## Database Integration

The module integrates with the existing database repositories:

- `trendRepository` - Trend storage and retrieval
- `postRepository` - Post management
- `userSettingsRepository` - User preferences
- `analyticsRepository` - Performance metrics
- `workflowRunRepository` - Workflow state tracking

## Error Types

Errors are classified for appropriate handling:

- `TRANSIENT` - Temporary errors (network, timeout) - retryable
- `RATE_LIMIT` - API rate limits - retryable with backoff
- `VALIDATION` - Invalid input - not retryable
- `AUTH` - Authentication failures - not retryable
- `PERMANENT` - Unrecoverable errors - not retryable

## Best Practices

1. **Always use workflow tracking** for observability
2. **Use retry utilities** for external API calls
3. **Check user settings** before generating content
4. **Mark trends as used** to avoid duplication
5. **Handle errors appropriately** based on classification
6. **Test with mocked LLM responses** to avoid API costs

## Extending

### Adding a New Agent

1. Create agent file in `src/lib/mastra/agents/`
2. Define instructions and model
3. Export from `agents/index.ts`

### Adding a New Workflow

1. Create workflow file in `src/lib/mastra/workflows/`
2. Define input/output schemas with Zod
3. Use `executeWithTracking` for state management
4. Export from `workflows/index.ts`
5. Create API route in `src/app/api/workflows/`

### Adding Scheduled Jobs

1. Add configuration to `src/lib/mastra/cron/config.ts`
2. Define cron expression, workflow name, and default input
