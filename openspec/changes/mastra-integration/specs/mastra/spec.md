# Specification: Mastra AI Integration

## Overview

This specification defines the requirements for integrating Mastra AI framework into AutoMarketeer for AI agent orchestration and workflow management.

---

## ADDED Requirements

### Requirement 1: Mastra Framework Setup

**Priority**: CRITICAL
**Dependencies**: None

#### Description
Install and configure the Mastra AI framework with LLM provider connections.

#### Acceptance Criteria
- [ ] Mastra package installed and dependencies resolved
- [ ] Mastra client initialized with proper configuration
- [ ] OpenAI provider configured with GPT-4 access
- [ ] Anthropic provider configured with Claude access
- [ ] Configuration validated on startup
- [ ] Environment variables properly secured

#### Scenarios

#### Scenario 1.1: Initialize Mastra client
```typescript
import { Mastra } from '@mastra/core';

const mastra = new Mastra({
  llm: {
    openai: { apiKey: process.env.OPENAI_API_KEY, model: 'gpt-4' },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-3-5-sonnet' },
  },
  logging: { level: 'info' },
});

// Should successfully initialize without errors
```

#### Scenario 1.2: Validate configuration
```typescript
const config = getMastraConfig();

// Should throw error if API keys are missing
expect(config.llm.openai.apiKey).toBeDefined();
expect(config.llm.anthropic.apiKey).toBeDefined();
```

#### Scenario 1.3: Test LLM connection
```typescript
const response = await mastra.llm.openai.chat({
  messages: [{ role: 'user', content: 'test' }],
});

// Should successfully connect and get response
expect(response).toBeDefined();
```

---

### Requirement 2: Agent Implementation

**Priority**: CRITICAL
**Dependencies**: Requirement 1

#### Description
Implement three specialized AI agents for trend discovery, content generation, and optimization.

#### Acceptance Criteria
- [ ] TrendDiscoveryAgent created with proper prompts
- [ ] ContentGenerationAgent created with proper prompts
- [ ] ContentOptimizerAgent created with proper prompts
- [ ] Each agent has access to required tools
- [ ] Each agent has appropriate LLM provider assigned
- [ ] Agent responses are properly typed
- [ ] Error handling implemented for agent failures

#### Scenarios

#### Scenario 2.1: TrendDiscoveryAgent scores a trend
```typescript
const agent = trendDiscoveryAgent;
const result = await agent.execute({
  title: 'AI Revolution in Marketing',
  hook: 'How AI is transforming digital marketing',
  source: 'reddit',
  metadata: { upvotes: 2500, comments: 150 },
});

// Should return score between 0-100
expect(result.score).toBeGreaterThanOrEqual(0);
expect(result.score).toBeLessThanOrEqual(100);
expect(result.category).toBeDefined();
expect(result.sentiment).toMatch(/positive|negative|neutral/);
```

#### Scenario 2.2: ContentGenerationAgent creates a post
```typescript
const agent = contentGenerationAgent;
const result = await agent.execute({
  trend: { title: 'AI Breakthrough', hook: '...' },
  platform: 'twitter',
  brandVoice: 'Professional and approachable',
  userSettings: { /* ... */ },
});

// Should return platform-optimized content
expect(result.content).toBeDefined();
expect(result.content.length).toBeLessThanOrEqual(280); // Twitter limit
expect(result.hashtags).toBeInstanceOf(Array);
expect(result.tone).toBe('professional');
```

#### Scenario 2.3: ContentOptimizerAgent analyzes performance
```typescript
const agent = contentOptimizerAgent;
const result = await agent.execute({
  postId: 'uuid',
  analytics: { likes: 100, comments: 20, ctr: 5.0 },
  historicalData: [/* ... */],
});

// Should return insights and recommendations
expect(result.performanceScore).toBeDefined();
expect(result.insights).toBeInstanceOf(Array);
expect(result.recommendations).toBeInstanceOf(Array);
```

---

### Requirement 3: Tool System

**Priority**: CRITICAL
**Dependencies**: Database module, Requirement 1

#### Description
Create tools that allow agents to interact with the database through repositories.

#### Acceptance Criteria
- [ ] TrendTools implemented with all CRUD operations
- [ ] PostTools implemented with all CRUD operations
- [ ] AnalyticsTools implemented for metrics access
- [ ] UserSettingsTools implemented for preferences access
- [ ] All tools have proper type definitions
- [ ] Input validation implemented for all tools
- [ ] Error handling for database operations

#### Scenarios

#### Scenario 3.1: Get top trends via tool
```typescript
const tool = trendTools.getTrends;
const result = await tool.execute({
  status: 'new',
  minScore: 80,
  limit: 10,
});

// Should return trends from database
expect(result).toBeInstanceOf(Array);
expect(result.length).toBeLessThanOrEqual(10);
expect(result[0].score).toBeGreaterThanOrEqual(80);
```

#### Scenario 3.2: Create post via tool
```typescript
const tool = postTools.createPost;
const result = await tool.execute({
  trendId: 'trend-uuid',
  platform: 'twitter',
  content: 'Amazing AI trend!',
  status: 'draft',
});

// Should create post in database
expect(result.id).toBeDefined();
expect(result.status).toBe('draft');
expect(result.createdAt).toBeDefined();
```

#### Scenario 3.3: Get analytics via tool
```typescript
const tool = analyticsTools.getPostAnalytics;
const result = await tool.execute({
  postId: 'post-uuid',
});

// Should return analytics with calculated metrics
expect(result.ctr).toBeDefined();
expect(result.engagementRate).toBeDefined();
```

---

### Requirement 4: Workflow Implementation

**Priority**: CRITICAL
**Dependencies**: Requirements 2, 3

#### Description
Implement four core workflows for trend discovery, content generation, publishing, and optimization.

#### Acceptance Criteria
- [ ] Trend Discovery Workflow implemented
- [ ] Content Generation Workflow implemented
- [ ] Publishing Workflow implemented
- [ ] Optimization Workflow implemented
- [ ] Each workflow properly orchestrates agents and tools
- [ ] Workflow state is tracked and persisted
- [ ] Error handling and retry logic implemented
- [ ] Workflows can be triggered via API

#### Scenarios

#### Scenario 4.1: Execute Trend Discovery Workflow
```typescript
const workflow = trendDiscoveryWorkflow;
const result = await workflow.execute({
  sources: ['reddit', 'twitter'],
  minScore: 70,
});

// Should discover and save trends
expect(result.trendsFound).toBeGreaterThan(0);
expect(result.trendsSaved).toBeGreaterThan(0);
expect(result.status).toBe('completed');
```

#### Scenario 4.2: Execute Content Generation Workflow
```typescript
const workflow = contentGenerationWorkflow;
const result = await workflow.execute({
  userId: 'user-uuid',
  trendsToUse: 5,
  platforms: ['twitter', 'linkedin'],
});

// Should generate posts for multiple platforms
expect(result.postsCreated).toBeGreaterThanOrEqual(5);
expect(result.platforms).toContain('twitter');
expect(result.platforms).toContain('linkedin');
```

#### Scenario 4.3: Execute Publishing Workflow
```typescript
const workflow = publishingWorkflow;
const result = await workflow.execute({
  postIds: ['post-1', 'post-2'],
});

// Should publish approved posts
expect(result.postsPublished).toBe(2);
expect(result.failures).toHaveLength(0);
```

#### Scenario 4.4: Workflow persists execution state
```typescript
const workflow = trendDiscoveryWorkflow;
const runId = await workflow.start({ sources: ['reddit'] });

// Should create workflow run record
const run = await workflowRunRepository.findById(runId);
expect(run.status).toBe('running');
expect(run.workflowName).toBe('trend-discovery');

await workflow.waitForCompletion(runId);

// Should update status on completion
const completedRun = await workflowRunRepository.findById(runId);
expect(completedRun.status).toBe('completed');
expect(completedRun.duration).toBeGreaterThan(0);
```

---

### Requirement 5: API Route Integration

**Priority**: HIGH
**Dependencies**: Requirement 4

#### Description
Create Next.js API routes to trigger and monitor workflows.

#### Acceptance Criteria
- [ ] POST /api/workflows/trend-discovery route created
- [ ] POST /api/workflows/generate-content route created
- [ ] POST /api/workflows/publish route created
- [ ] GET /api/workflows/status/:id route created
- [ ] GET /api/workflows/runs route for history
- [ ] Proper authentication and authorization
- [ ] Request validation implemented
- [ ] Error responses properly formatted

#### Scenarios

#### Scenario 5.1: Trigger trend discovery via API
```typescript
const response = await fetch('/api/workflows/trend-discovery', {
  method: 'POST',
  body: JSON.stringify({ sources: ['reddit', 'twitter'] }),
});

// Should return workflow run ID
expect(response.status).toBe(200);
const data = await response.json();
expect(data.runId).toBeDefined();
expect(data.status).toBe('running');
```

#### Scenario 5.2: Check workflow status
```typescript
const response = await fetch(`/api/workflows/status/${runId}`);
const data = await response.json();

// Should return current status
expect(data.status).toMatch(/running|completed|failed/);
expect(data.startedAt).toBeDefined();
```

#### Scenario 5.3: Get workflow history
```typescript
const response = await fetch('/api/workflows/runs?limit=10');
const data = await response.json();

// Should return recent runs
expect(data.runs).toBeInstanceOf(Array);
expect(data.runs.length).toBeLessThanOrEqual(10);
```

---

### Requirement 6: Scheduled Workflows

**Priority**: HIGH
**Dependencies**: Requirements 4, 5

#### Description
Set up scheduled execution for recurring workflows.

#### Acceptance Criteria
- [ ] Trend Discovery Workflow runs every 6 hours
- [ ] Optimization Workflow runs daily
- [ ] Cron configuration properly set up
- [ ] Scheduled runs tracked in database
- [ ] Failure notifications implemented
- [ ] Can disable/enable schedules via config

#### Scenarios

#### Scenario 6.1: Scheduled trend discovery executes
```typescript
// After 6 hours have passed
const runs = await workflowRunRepository.findByWorkflowName('trend-discovery');

// Should have executed automatically
const recentRuns = runs.filter(r =>
  r.startedAt > new Date(Date.now() - 7 * 60 * 60 * 1000)
);
expect(recentRuns.length).toBeGreaterThan(0);
```

#### Scenario 6.2: Can disable scheduled workflows
```typescript
// Update configuration
updateConfig({ workflows: { trendDiscovery: { enabled: false } } });

// Should not execute on schedule
const previousCount = await workflowRunRepository.count();
await waitForSchedule();
const newCount = await workflowRunRepository.count();
expect(newCount).toBe(previousCount);
```

---

### Requirement 7: Error Handling and Retry Logic

**Priority**: HIGH
**Dependencies**: Requirements 2, 3, 4

#### Description
Implement comprehensive error handling with automatic retries.

#### Acceptance Criteria
- [ ] LLM call failures retry 3 times with exponential backoff
- [ ] Database operation failures retry 2 times
- [ ] Workflow failures are logged and tracked
- [ ] Failed workflows can be manually restarted
- [ ] Error messages are clear and actionable
- [ ] Transient errors don't cause complete failures

#### Scenarios

#### Scenario 7.1: LLM call retries on failure
```typescript
// Mock LLM to fail twice then succeed
let attempts = 0;
mockLLM.mockImplementation(() => {
  attempts++;
  if (attempts < 3) throw new Error('Rate limit');
  return { content: 'success' };
});

const result = await agent.execute(input);

// Should succeed after retries
expect(attempts).toBe(3);
expect(result.content).toBe('success');
```

#### Scenario 7.2: Workflow fails and records error
```typescript
// Mock tool to always fail
mockTool.mockRejectedValue(new Error('Database unavailable'));

const result = await workflow.execute(input);

// Should fail gracefully and record error
expect(result.status).toBe('failed');

const run = await workflowRunRepository.findById(result.runId);
expect(run.status).toBe('failed');
expect(run.error).toContain('Database unavailable');
```

#### Scenario 7.3: Can manually restart failed workflow
```typescript
const failedRun = await workflowRunRepository.findById(failedRunId);
expect(failedRun.status).toBe('failed');

// Restart the workflow
const newRun = await workflow.restart(failedRunId);

// Should create new run with same input
expect(newRun.input).toEqual(failedRun.input);
expect(newRun.status).toBe('running');
```

---

### Requirement 8: Monitoring and Observability

**Priority**: MEDIUM
**Dependencies**: Requirements 4, 5

#### Description
Implement monitoring and logging for workflow execution.

#### Acceptance Criteria
- [ ] All workflow runs logged to database
- [ ] Structured logging for debugging
- [ ] Success/failure metrics tracked
- [ ] LLM usage and costs tracked
- [ ] Workflow duration metrics collected
- [ ] Dashboard or UI for monitoring (optional)

#### Scenarios

#### Scenario 8.1: Workflow run details are logged
```typescript
const result = await workflow.execute(input);
const run = await workflowRunRepository.findById(result.runId);

// Should log all execution details
expect(run.workflowName).toBe('trend-discovery');
expect(run.input).toEqual(input);
expect(run.output).toBeDefined();
expect(run.duration).toBeGreaterThan(0);
expect(run.startedAt).toBeDefined();
expect(run.completedAt).toBeDefined();
```

#### Scenario 8.2: Can query workflow statistics
```typescript
const stats = await workflowRunRepository.getWorkflowStats('trend-discovery');

// Should return aggregated statistics
expect(stats.totalRuns).toBeGreaterThan(0);
expect(stats.completed).toBeDefined();
expect(stats.failed).toBeDefined();
expect(stats.avgDuration).toBeGreaterThan(0);
```

---

### Requirement 9: Testing Infrastructure

**Priority**: HIGH
**Dependencies**: Requirements 2, 3, 4

#### Description
Comprehensive testing for agents, tools, and workflows.

#### Acceptance Criteria
- [ ] Unit tests for all agents (90%+ coverage)
- [ ] Unit tests for all tools (90%+ coverage)
- [ ] Integration tests for workflows
- [ ] Mock LLM responses for deterministic testing
- [ ] Test fixtures for common scenarios
- [ ] E2E tests for critical paths

#### Scenarios

#### Scenario 9.1: Agent tests with mocked LLM
```typescript
describe('TrendDiscoveryAgent', () => {
  it('should score trend accurately', async () => {
    mockLLM.mockResolvedValue({
      score: 85,
      category: 'technology',
      sentiment: 'positive',
    });

    const result = await agent.execute(trendData);
    expect(result.score).toBe(85);
  });
});
```

#### Scenario 9.2: Workflow integration test
```typescript
describe('TrendDiscoveryWorkflow', () => {
  it('should discover and save trends', async () => {
    const result = await workflow.execute({ sources: ['reddit'] });

    expect(result.status).toBe('completed');
    expect(result.trendsFound).toBeGreaterThan(0);

    const savedTrends = await trendRepository.findAll({ status: 'new' });
    expect(savedTrends.length).toBeGreaterThan(0);
  });
});
```

---

## Non-Functional Requirements

### Performance
- Workflows should complete within reasonable time:
  - Trend Discovery: < 5 minutes
  - Content Generation: < 2 minutes per post
  - Publishing: < 1 minute per post
  - Optimization: < 3 minutes
- LLM calls should timeout after 30 seconds
- Database queries should complete in < 1 second

### Scalability
- Support multiple concurrent workflow executions
- Handle up to 1000 trends in discovery workflow
- Generate up to 100 posts in content workflow
- Process analytics for up to 1000 posts

### Security
- API keys stored securely in environment variables
- API routes protected with authentication
- Input validation on all tool parameters
- No sensitive data in logs or errors

### Reliability
- 99% workflow success rate (excluding intentional failures)
- Automatic retry for transient failures
- Graceful degradation when LLMs unavailable
- Data consistency maintained across failures

### Maintainability
- Clear separation of concerns (agents, tools, workflows)
- Comprehensive documentation and JSDoc
- Consistent error handling patterns
- Easy to add new agents and workflows

---

## Success Metrics

1. **Workflow Success Rate**: > 95% of workflows complete successfully
2. **Agent Response Quality**: Manual review shows > 90% quality posts
3. **Trend Discovery Rate**: Discovers > 50 high-quality trends per day
4. **Content Generation Speed**: < 30 seconds per post on average
5. **System Uptime**: > 99.5% uptime for workflow execution
6. **Test Coverage**: > 85% overall code coverage

---

## Future Enhancements

- Advanced agent memory and learning
- Multi-user support with isolated workflows
- Real-time workflow monitoring dashboard
- Custom workflow builder UI
- Integration with external tools (Zapier, Make.com)
- Advanced analytics and reporting
- A/B testing automation
- Image and video generation agents
