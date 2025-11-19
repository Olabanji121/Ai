# Design: Mastra AI Integration

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                          │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │  UI Components │  │  API Routes    │  │  Cron Jobs    │ │
│  └────────┬───────┘  └────────┬───────┘  └───────┬───────┘ │
│           │                   │                   │         │
└───────────┼───────────────────┼───────────────────┼─────────┘
            │                   │                   │
            ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Mastra Framework                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Workflow Engine                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │  │
│  │  │   Trend      │  │   Content    │  │ Publishing │ │  │
│  │  │  Discovery   │  │  Generation  │  │  Workflow  │ │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬─────┘ │  │
│  └─────────┼──────────────────┼──────────────────┼───────┘  │
│            │                  │                  │          │
│  ┌─────────▼──────────────────▼──────────────────▼───────┐  │
│  │                    Agent Layer                         │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌───────────────┐ │  │
│  │  │   Trend    │  │   Content    │  │   Content     │ │  │
│  │  │ Discovery  │  │  Generation  │  │  Optimizer    │ │  │
│  │  │   Agent    │  │    Agent     │  │    Agent      │ │  │
│  │  └─────┬──────┘  └──────┬───────┘  └───────┬───────┘ │  │
│  └────────┼─────────────────┼──────────────────┼─────────┘  │
│           │                 │                  │            │
│  ┌────────▼─────────────────▼──────────────────▼─────────┐  │
│  │                     Tools Layer                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│  │
│  │  │  Trend   │  │   Post   │  │Analytics│  │Settings││  │
│  │  │  Tools   │  │  Tools   │  │  Tools  │  │ Tools  ││  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘│  │
│  └───────┼─────────────┼──────────────┼────────────┼─────┘  │
│          │             │              │            │        │
│  ┌───────▼─────────────▼──────────────▼────────────▼─────┐  │
│  │               LLM Provider Layer                       │  │
│  │  ┌──────────────┐              ┌──────────────┐       │  │
│  │  │   OpenAI     │              │  Anthropic   │       │  │
│  │  │   GPT-4      │              │   Claude     │       │  │
│  │  └──────────────┘              └──────────────┘       │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Repository Pattern                       │  │
│  │  ┌──────┐  ┌──────┐  ┌──────────┐  ┌──────────────┐ │  │
│  │  │Trends│  │Posts │  │Analytics │  │WorkflowRuns  │ │  │
│  │  └──────┘  └──────┘  └──────────┘  └──────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                   PostgreSQL + Drizzle ORM                  │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Mastra Framework Selection

**Decision**: Use Mastra AI as the orchestration framework

**Rationale**:
- **TypeScript-first**: Native TypeScript support matches our stack perfectly
- **Agent-centric**: Built specifically for multi-agent coordination
- **Workflow engine**: Includes robust workflow orchestration out of the box
- **Tool system**: Built-in framework for providing tools to agents
- **Next.js compatible**: Seamless integration with Next.js 15
- **Active development**: Well-maintained with regular updates
- **Documentation**: Comprehensive docs and examples

**Alternatives Considered**:
- **LangChain**: More complex, JavaScript-first, steeper learning curve
- **Custom solution**: Would require significant development time, reinventing the wheel
- **AutoGen**: Python-based, requires separate service

### 2. Agent Architecture

**Decision**: Three specialized agents with clear responsibilities

**Agents**:

1. **TrendDiscoveryAgent**
   - **Purpose**: Discover and score viral trends
   - **Tools**: TrendTools, external API tools (Reddit, Twitter, Google Trends)
   - **LLM**: GPT-4 (structured output, reliable scoring)
   - **Prompt**: Analyze trend virality, relevance, and content potential

2. **ContentGenerationAgent**
   - **Purpose**: Generate platform-optimized content
   - **Tools**: TrendTools, PostTools, UserSettingsTools
   - **LLM**: Claude 3.5 Sonnet (creative, high-quality content)
   - **Prompt**: Create engaging posts matching brand voice and platform requirements

3. **ContentOptimizerAgent**
   - **Purpose**: Analyze performance and suggest improvements
   - **Tools**: AnalyticsTools, PostTools
   - **LLM**: GPT-4 (analytical, data-driven insights)
   - **Prompt**: Analyze metrics and provide optimization recommendations

**Rationale**:
- **Separation of concerns**: Each agent has a single, clear purpose
- **Specialized prompts**: Optimized prompts for specific tasks
- **Flexibility**: Easy to replace or upgrade individual agents
- **Scalability**: Can add more agents without affecting existing ones

### 3. Workflow Design

**Decision**: Four core workflows orchestrating agent interactions

**Workflows**:

1. **Trend Discovery Workflow** (Scheduled - every 6 hours)
   ```
   Start → Fetch Trends (Reddit/Twitter/Google) → Score Trends (Agent)
   → Filter by Score → Save to DB → End
   ```

2. **Content Generation Workflow** (On-demand or scheduled)
   ```
   Start → Get Top Trends → For Each Trend:
   → Get User Settings → Generate Posts (Agent) → Save Drafts → End
   ```

3. **Publishing Workflow** (Manual approval + scheduled)
   ```
   Start → Get Approved Posts → For Each Post:
   → Schedule Publishing → Publish to Platform → Update Status → End
   ```

4. **Optimization Workflow** (Scheduled - daily)
   ```
   Start → Fetch Analytics → Analyze Performance (Agent)
   → Generate Insights → Update Post Variations → End
   ```

**Rationale**:
- **Clear flow**: Each workflow has a specific purpose and flow
- **Composable**: Workflows can call other workflows if needed
- **Resumable**: State is tracked, can resume after failures
- **Observable**: Easy to monitor and debug through Mastra dashboard

### 4. Tool System Design

**Decision**: Thin wrapper layer around database repositories

**Structure**:
```typescript
// src/lib/mastra/tools/trend-tools.ts
export const trendTools = {
  name: 'trend_tools',
  description: 'Tools for managing viral trends',
  functions: {
    getTrends: { /* wraps trendRepository.findAll */ },
    createTrend: { /* wraps trendRepository.create */ },
    markTrendUsed: { /* wraps trendRepository.markAsUsed */ },
  },
};
```

**Rationale**:
- **Thin layer**: Minimal logic, just parameter validation and repository calls
- **Type-safe**: Full TypeScript types for tool parameters and returns
- **Reusable**: Tools can be used by any agent
- **Testable**: Easy to mock for agent testing
- **Direct access**: No unnecessary abstraction over database layer

### 5. LLM Provider Strategy

**Decision**: Use both OpenAI and Anthropic with specific assignments

**Assignment**:
- **OpenAI GPT-4**: Structured tasks (trend scoring, analytics)
- **Anthropic Claude 3.5 Sonnet**: Creative tasks (content generation)
- **Fallback**: If primary fails, fallback to secondary

**Rationale**:
- **Best of both**: Leverage strengths of each model
- **Cost optimization**: Use appropriate model for each task
- **Reliability**: Fallback prevents complete failures
- **Flexibility**: Easy to switch models via configuration

### 6. State Management

**Decision**: Use workflow-runs table for execution tracking

**Approach**:
- Mastra handles in-memory workflow state
- Persist workflow runs to `workflow_runs` table (already exists)
- Store input, output, status, duration in database
- Use for monitoring, debugging, and analytics

**Rationale**:
- **Persistence**: Survives server restarts
- **Observability**: Can query workflow history
- **Analytics**: Track success rates, durations, costs
- **Integration**: Reuses existing database infrastructure

### 7. Error Handling Strategy

**Decision**: Multi-layer error handling with retries

**Layers**:
1. **Tool level**: Catch database errors, validate inputs
2. **Agent level**: Catch LLM errors, implement retry logic
3. **Workflow level**: Catch workflow errors, persist failures
4. **API level**: Catch all errors, return appropriate responses

**Retry Logic**:
- LLM calls: 3 retries with exponential backoff (2s, 4s, 8s)
- Database operations: 2 retries with 1s backoff
- External APIs: 3 retries with 5s backoff
- Workflow level: Mark as failed, allow manual restart

**Rationale**:
- **Resilience**: System can recover from transient failures
- **User experience**: Minimize failed operations
- **Debugging**: Clear error messages at each layer
- **Monitoring**: Failed operations tracked in database

### 8. Configuration Management

**Decision**: Environment-based configuration with validation

**Structure**:
```typescript
// src/lib/mastra/config.ts
export const mastraConfig = {
  llm: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4-turbo-preview',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: 'claude-3-5-sonnet-20241022',
    },
  },
  workflows: {
    trendDiscovery: {
      schedule: '0 */6 * * *', // Every 6 hours
      enabled: true,
    },
  },
};
```

**Rationale**:
- **Environment-specific**: Different settings for dev/staging/prod
- **Type-safe**: Validation at startup
- **Centralized**: All configuration in one place
- **Secure**: Sensitive data in environment variables

## File Structure

```
src/lib/mastra/
├── index.ts                      # Main export file
├── config.ts                     # Mastra configuration
├── client.ts                     # Mastra client initialization
│
├── agents/
│   ├── index.ts                  # Export all agents
│   ├── trend-discovery.agent.ts  # Trend discovery agent
│   ├── content-generation.agent.ts # Content generation agent
│   └── content-optimizer.agent.ts  # Content optimizer agent
│
├── workflows/
│   ├── index.ts                  # Export all workflows
│   ├── trend-discovery.workflow.ts
│   ├── content-generation.workflow.ts
│   ├── publishing.workflow.ts
│   └── optimization.workflow.ts
│
├── tools/
│   ├── index.ts                  # Export all tools
│   ├── trend.tools.ts            # Trend CRUD operations
│   ├── post.tools.ts             # Post CRUD operations
│   ├── analytics.tools.ts        # Analytics operations
│   └── user-settings.tools.ts    # User settings operations
│
└── __tests__/
    ├── agents/                   # Agent tests
    ├── workflows/                # Workflow tests
    └── tools/                    # Tool tests
```

## Integration Points

### 1. Database Integration
- Tools call repository methods directly
- Workflow runs tracked in `workflow_runs` table
- Agents use tools to access database

### 2. API Routes
```
POST /api/workflows/trend-discovery    - Trigger trend discovery
POST /api/workflows/generate-content   - Generate content from trends
POST /api/workflows/publish            - Publish approved posts
GET  /api/workflows/status/:id         - Get workflow status
```

### 3. Cron Jobs
- Use Next.js cron or external scheduler (Vercel Cron)
- Trigger workflows via API routes
- Store cron run results in database

## Performance Considerations

1. **Concurrent Workflows**: Limit concurrent workflows to prevent resource exhaustion
2. **Rate Limiting**: Implement rate limiting for LLM calls
3. **Caching**: Cache frequently used data (user settings, trends)
4. **Batch Processing**: Process multiple items in parallel where possible
5. **Connection Pooling**: Reuse database connections (already implemented)

## Security Considerations

1. **API Keys**: Store in environment variables, never commit to repo
2. **Input Validation**: Validate all tool inputs
3. **Rate Limiting**: Prevent abuse of workflow triggers
4. **Error Messages**: Don't expose sensitive data in errors
5. **Access Control**: Verify user permissions before executing workflows

## Monitoring & Observability

1. **Workflow Tracking**: All runs stored in `workflow_runs` table
2. **Logging**: Structured logging for all operations
3. **Metrics**: Track success rates, durations, costs
4. **Alerting**: Notify on workflow failures
5. **Dashboard**: Mastra built-in dashboard for workflow monitoring

## Testing Strategy

1. **Unit Tests**: Test individual agents and tools
2. **Integration Tests**: Test workflows end-to-end
3. **Mock LLMs**: Use mock responses for deterministic tests
4. **Mock Database**: Use in-memory database for tests
5. **E2E Tests**: Test full flow from API to database

## Future Enhancements

1. **More Agents**: SEO optimizer, image generation, hashtag suggester
2. **Advanced Workflows**: A/B testing, audience segmentation
3. **Multi-user**: Support multiple user accounts
4. **Analytics Dashboard**: Real-time workflow monitoring
5. **Custom Integrations**: Zapier, Make.com, custom webhooks
