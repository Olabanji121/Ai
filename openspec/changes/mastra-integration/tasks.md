# Implementation Tasks: Mastra AI Integration

## Task 1: Project Setup & Dependencies

### 1.1 Install Mastra Framework
- [ ] Install `@mastra/core` package
- [ ] Install `@mastra/llm-openai` package
- [ ] Install `@mastra/llm-anthropic` package
- [ ] Install `zod` for schema validation
- [ ] Update `package.json` with correct versions
- [ ] Run `pnpm install` and verify no conflicts

### 1.2 Environment Configuration
- [ ] Add `OPENAI_API_KEY` to `.env.local.example`
- [ ] Add `ANTHROPIC_API_KEY` to `.env.local.example`
- [ ] Update `.gitignore` to exclude `.env.local`
- [ ] Document API key setup in README
- [ ] Create `.env.test` with test API keys or mocks

### 1.3 Create Directory Structure
- [ ] Create `src/lib/mastra/` directory
- [ ] Create `src/lib/mastra/agents/` directory
- [ ] Create `src/lib/mastra/workflows/` directory
- [ ] Create `src/lib/mastra/tools/` directory
- [ ] Create `src/lib/mastra/__tests__/` directory
- [ ] Create index files for each subdirectory

---

## Task 2: Mastra Configuration

### 2.1 Create Configuration File
- [ ] Create `src/lib/mastra/config.ts`
- [ ] Define `MastraConfig` TypeScript interface
- [ ] Add OpenAI configuration with model selection
- [ ] Add Anthropic configuration with model selection
- [ ] Add workflow scheduling configuration
- [ ] Add logging configuration
- [ ] Add environment variable validation with Zod

### 2.2 Initialize Mastra Client
- [ ] Create `src/lib/mastra/client.ts`
- [ ] Initialize Mastra instance with config
- [ ] Configure OpenAI LLM provider
- [ ] Configure Anthropic LLM provider
- [ ] Add connection health checks
- [ ] Export singleton Mastra client
- [ ] Add error handling for initialization failures

### 2.3 Create Main Export File
- [ ] Create `src/lib/mastra/index.ts`
- [ ] Export Mastra client
- [ ] Export configuration
- [ ] Export all agents (will add later)
- [ ] Export all workflows (will add later)
- [ ] Export all tools (will add later)

---

## Task 3: Tool Implementation

### 3.1 Create Trend Tools
- [ ] Create `src/lib/mastra/tools/trend.tools.ts`
- [ ] Implement `getTrends` tool (wraps `trendRepository.findAll`)
- [ ] Implement `getTopTrends` tool (wraps `trendRepository.findTopTrends`)
- [ ] Implement `createTrend` tool (wraps `trendRepository.create`)
- [ ] Implement `updateTrend` tool (wraps `trendRepository.update`)
- [ ] Implement `markTrendUsed` tool (wraps `trendRepository.markAsUsed`)
- [ ] Add Zod schemas for input validation
- [ ] Add error handling and logging
- [ ] Export `trendTools` object

### 3.2 Create Post Tools
- [ ] Create `src/lib/mastra/tools/post.tools.ts`
- [ ] Implement `createPost` tool (wraps `postRepository.create`)
- [ ] Implement `getPost` tool (wraps `postRepository.findById`)
- [ ] Implement `getPostWithTrend` tool (wraps `postRepository.findByIdWithTrend`)
- [ ] Implement `approvePost` tool (wraps `postRepository.approve`)
- [ ] Implement `publishPost` tool (wraps `postRepository.markPublished`)
- [ ] Implement `getPostsByPlatform` tool
- [ ] Add Zod schemas for input validation
- [ ] Export `postTools` object

### 3.3 Create Analytics Tools
- [ ] Create `src/lib/mastra/tools/analytics.tools.ts`
- [ ] Implement `getPostAnalytics` tool (wraps `analyticsRepository.findByPostId`)
- [ ] Implement `getLatestAnalytics` tool
- [ ] Implement `getPlatformStats` tool (wraps `getAggregateByPlatform`)
- [ ] Implement `calculatePerformanceScore` tool
- [ ] Add Zod schemas for input validation
- [ ] Export `analyticsTools` object

### 3.4 Create User Settings Tools
- [ ] Create `src/lib/mastra/tools/user-settings.tools.ts`
- [ ] Implement `getUserSettings` tool (wraps `userSettingsRepository.findByUserId`)
- [ ] Implement `updateBrandVoice` tool
- [ ] Implement `getPlatforms` tool
- [ ] Add Zod schemas for input validation
- [ ] Export `userSettingsTools` object

### 3.5 Create Tool Index
- [ ] Create `src/lib/mastra/tools/index.ts`
- [ ] Export all tool objects
- [ ] Create `allTools` array combining all tools
- [ ] Add TypeScript types for tool parameters and returns

---

## Task 4: Agent Implementation

### 4.1 Create Trend Discovery Agent
- [ ] Create `src/lib/mastra/agents/trend-discovery.agent.ts`
- [ ] Define agent configuration with OpenAI GPT-4
- [ ] Write comprehensive system prompt for trend scoring
- [ ] Add trend analysis instructions (virality, relevance, content potential)
- [ ] Provide examples of good vs bad trends
- [ ] Assign `trendTools` to agent
- [ ] Add structured output schema (score, category, sentiment)
- [ ] Test agent with sample trends
- [ ] Export `trendDiscoveryAgent`

### 4.2 Create Content Generation Agent
- [ ] Create `src/lib/mastra/agents/content-generation.agent.ts`
- [ ] Define agent configuration with Anthropic Claude 3.5 Sonnet
- [ ] Write comprehensive system prompt for content creation
- [ ] Add platform-specific guidelines (Twitter 280 chars, LinkedIn tone, etc.)
- [ ] Add brand voice adaptation instructions
- [ ] Provide content examples for each platform
- [ ] Assign `trendTools`, `postTools`, `userSettingsTools` to agent
- [ ] Add structured output schema (content, hashtags, tone)
- [ ] Test agent with sample trends and user settings
- [ ] Export `contentGenerationAgent`

### 4.3 Create Content Optimizer Agent
- [ ] Create `src/lib/mastra/agents/content-optimizer.agent.ts`
- [ ] Define agent configuration with OpenAI GPT-4
- [ ] Write comprehensive system prompt for performance analysis
- [ ] Add analytics interpretation instructions
- [ ] Add optimization recommendation guidelines
- [ ] Provide examples of good insights
- [ ] Assign `analyticsTools`, `postTools` to agent
- [ ] Add structured output schema (insights, recommendations, score)
- [ ] Test agent with sample analytics data
- [ ] Export `contentOptimizerAgent`

### 4.4 Create Agent Index
- [ ] Create `src/lib/mastra/agents/index.ts`
- [ ] Export all agents
- [ ] Add TypeScript types for agent inputs and outputs
- [ ] Add helper functions for agent invocation

---

## Task 5: Workflow Implementation

### 5.1 Create Trend Discovery Workflow
- [ ] Create `src/lib/mastra/workflows/trend-discovery.workflow.ts`
- [ ] Define workflow input schema (sources, filters)
- [ ] Implement step 1: Fetch trends from sources (placeholder for now)
- [ ] Implement step 2: Score trends using `trendDiscoveryAgent`
- [ ] Implement step 3: Filter by score threshold
- [ ] Implement step 4: Save trends using `trendTools.createTrend`
- [ ] Implement step 5: Track workflow run in database
- [ ] Add error handling and retry logic
- [ ] Add logging for each step
- [ ] Export workflow function

### 5.2 Create Content Generation Workflow
- [ ] Create `src/lib/mastra/workflows/content-generation.workflow.ts`
- [ ] Define workflow input schema (userId, platforms, count)
- [ ] Implement step 1: Get top trends using `trendTools.getTopTrends`
- [ ] Implement step 2: Get user settings using `userSettingsTools`
- [ ] Implement step 3: Generate posts using `contentGenerationAgent`
- [ ] Implement step 4: Save posts using `postTools.createPost`
- [ ] Implement step 5: Mark trends as used
- [ ] Implement step 6: Track workflow run
- [ ] Add parallel processing for multiple platforms
- [ ] Add error handling for each platform
- [ ] Export workflow function

### 5.3 Create Publishing Workflow
- [ ] Create `src/lib/mastra/workflows/publishing.workflow.ts`
- [ ] Define workflow input schema (postIds)
- [ ] Implement step 1: Get approved posts
- [ ] Implement step 2: Validate posts ready for publishing
- [ ] Implement step 3: Publish to platforms (placeholder for now)
- [ ] Implement step 4: Update post status using `postTools.publishPost`
- [ ] Implement step 5: Track workflow run
- [ ] Add error handling for publish failures
- [ ] Add retry logic for transient failures
- [ ] Export workflow function

### 5.4 Create Optimization Workflow
- [ ] Create `src/lib/mastra/workflows/optimization.workflow.ts`
- [ ] Define workflow input schema (date range, platforms)
- [ ] Implement step 1: Get recent posts with analytics
- [ ] Implement step 2: Analyze performance using `contentOptimizerAgent`
- [ ] Implement step 3: Generate optimization insights
- [ ] Implement step 4: Save insights (extend database if needed)
- [ ] Implement step 5: Track workflow run
- [ ] Add aggregation of insights across posts
- [ ] Add error handling
- [ ] Export workflow function

### 5.5 Create Workflow Index
- [ ] Create `src/lib/mastra/workflows/index.ts`
- [ ] Export all workflows
- [ ] Add TypeScript types for workflow inputs and outputs
- [ ] Add helper functions for workflow execution

---

## Task 6: Workflow State Tracking

### 6.1 Create Workflow Run Utilities
- [ ] Create `src/lib/mastra/utils/workflow-tracking.ts`
- [ ] Implement `startWorkflowRun(name, input)` function
- [ ] Implement `completeWorkflowRun(id, output)` function
- [ ] Implement `failWorkflowRun(id, error)` function
- [ ] Implement `getWorkflowRun(id)` function
- [ ] Use `workflowRunRepository` for all operations
- [ ] Add error handling
- [ ] Export all functions

### 6.2 Integrate Tracking into Workflows
- [ ] Update Trend Discovery Workflow to track execution
- [ ] Update Content Generation Workflow to track execution
- [ ] Update Publishing Workflow to track execution
- [ ] Update Optimization Workflow to track execution
- [ ] Ensure all workflows call `startWorkflowRun` at start
- [ ] Ensure all workflows call `completeWorkflowRun` on success
- [ ] Ensure all workflows call `failWorkflowRun` on error

---

## Task 7: API Routes

### 7.1 Create Workflow API Routes
- [ ] Create `src/app/api/workflows/trend-discovery/route.ts`
- [ ] Create `src/app/api/workflows/generate-content/route.ts`
- [ ] Create `src/app/api/workflows/publish/route.ts`
- [ ] Create `src/app/api/workflows/optimize/route.ts`
- [ ] Implement POST handlers for each workflow
- [ ] Add request body validation with Zod
- [ ] Add authentication middleware (placeholder for now)
- [ ] Return workflow run ID in response

### 7.2 Create Status API Routes
- [ ] Create `src/app/api/workflows/status/[id]/route.ts`
- [ ] Implement GET handler for workflow status
- [ ] Return current status, progress, and results
- [ ] Add error handling for invalid IDs

### 7.3 Create Workflow History API
- [ ] Create `src/app/api/workflows/runs/route.ts`
- [ ] Implement GET handler with pagination
- [ ] Add filtering by workflow name, status, date range
- [ ] Return workflow run history
- [ ] Add sorting by date (newest first)

### 7.4 Add API Documentation
- [ ] Document all API endpoints in README
- [ ] Add request/response examples
- [ ] Document error codes and messages
- [ ] Add authentication requirements (for future)

---

## Task 8: Scheduled Workflows

### 8.1 Set Up Cron Configuration
- [ ] Create `src/lib/mastra/cron/config.ts`
- [ ] Define cron schedule for Trend Discovery (every 6 hours)
- [ ] Define cron schedule for Optimization (daily)
- [ ] Add enable/disable flags for each schedule
- [ ] Export cron configuration

### 8.2 Implement Cron Jobs
- [ ] Install `node-cron` or use Vercel Cron
- [ ] Create `src/lib/mastra/cron/scheduler.ts`
- [ ] Implement trend discovery cron job
- [ ] Implement optimization cron job
- [ ] Add logging for scheduled executions
- [ ] Add error notifications for failures
- [ ] Export scheduler initialization function

### 8.3 Integrate with Next.js
- [ ] Update `src/app/api/cron/route.ts` (or create if doesn't exist)
- [ ] Call scheduler on server startup
- [ ] Add health check endpoint for cron status
- [ ] Test scheduled execution in development

---

## Task 9: Error Handling & Retry Logic

### 9.1 Create Retry Utilities
- [ ] Create `src/lib/mastra/utils/retry.ts`
- [ ] Implement `retryWithBackoff` function
- [ ] Add exponential backoff calculation (2s, 4s, 8s, 16s)
- [ ] Add configurable max retries
- [ ] Add logging for retry attempts
- [ ] Export retry utilities

### 9.2 Integrate Retry Logic
- [ ] Add retry to LLM calls in agents (3 retries)
- [ ] Add retry to database operations in tools (2 retries)
- [ ] Add retry to workflow steps
- [ ] Add timeout handling for long-running operations
- [ ] Test retry behavior with mocked failures

### 9.3 Create Error Handler Middleware
- [ ] Create `src/lib/mastra/utils/error-handler.ts`
- [ ] Implement error classification (transient vs permanent)
- [ ] Implement error logging with context
- [ ] Implement error notification system (placeholder)
- [ ] Export error handler functions

### 9.4 Add Error Handling to All Components
- [ ] Update all agents with proper error handling
- [ ] Update all tools with proper error handling
- [ ] Update all workflows with proper error handling
- [ ] Update all API routes with proper error handling
- [ ] Ensure errors are logged and tracked

---

## Task 10: Testing

### 10.1 Set Up Testing Infrastructure
- [ ] Update `vitest.config.ts` to include Mastra tests
- [ ] Create mock LLM responses in `__tests__/mocks/llm.ts`
- [ ] Create test fixtures for trends, posts, analytics
- [ ] Create test helpers for workflow execution
- [ ] Set up test database (use existing setup)

### 10.2 Write Tool Tests
- [ ] Create `src/lib/mastra/tools/__tests__/trend.tools.test.ts`
- [ ] Create `src/lib/mastra/tools/__tests__/post.tools.test.ts`
- [ ] Create `src/lib/mastra/tools/__tests__/analytics.tools.test.ts`
- [ ] Test all tool functions with valid inputs
- [ ] Test error handling with invalid inputs
- [ ] Test database integration
- [ ] Achieve 90%+ coverage for tools

### 10.3 Write Agent Tests
- [ ] Create `src/lib/mastra/agents/__tests__/trend-discovery.agent.test.ts`
- [ ] Create `src/lib/mastra/agents/__tests__/content-generation.agent.test.ts`
- [ ] Create `src/lib/mastra/agents/__tests__/content-optimizer.agent.test.ts`
- [ ] Mock LLM responses for deterministic testing
- [ ] Test agent prompts with various inputs
- [ ] Test structured output parsing
- [ ] Test error handling
- [ ] Achieve 85%+ coverage for agents

### 10.4 Write Workflow Tests
- [ ] Create `src/lib/mastra/workflows/__tests__/trend-discovery.workflow.test.ts`
- [ ] Create `src/lib/mastra/workflows/__tests__/content-generation.workflow.test.ts`
- [ ] Create `src/lib/mastra/workflows/__tests__/publishing.workflow.test.ts`
- [ ] Create `src/lib/mastra/workflows/__tests__/optimization.workflow.test.ts`
- [ ] Test end-to-end workflow execution
- [ ] Test error handling and retry logic
- [ ] Test state tracking
- [ ] Achieve 80%+ coverage for workflows

### 10.5 Write API Route Tests
- [ ] Create tests for all workflow trigger routes
- [ ] Create tests for status and history routes
- [ ] Test request validation
- [ ] Test authentication (when implemented)
- [ ] Test error responses

### 10.6 Run Full Test Suite
- [ ] Run `pnpm test` and ensure all tests pass
- [ ] Run `pnpm test:coverage` and verify coverage thresholds
- [ ] Fix any failing tests
- [ ] Address any coverage gaps

---

## Task 11: Documentation

### 11.1 Add JSDoc Comments
- [ ] Add JSDoc to all agent files
- [ ] Add JSDoc to all tool files
- [ ] Add JSDoc to all workflow files
- [ ] Add JSDoc to configuration files
- [ ] Add JSDoc to utility files
- [ ] Include parameter descriptions and examples

### 11.2 Create Mastra README
- [ ] Create `src/lib/mastra/README.md`
- [ ] Document architecture overview
- [ ] Document each agent with usage examples
- [ ] Document each workflow with examples
- [ ] Document API routes
- [ ] Add troubleshooting section
- [ ] Add configuration guide

### 11.3 Update Main Project README
- [ ] Add Mastra integration section to main README
- [ ] Document required environment variables
- [ ] Add workflow execution examples
- [ ] Add API usage examples
- [ ] Link to Mastra README for details

---

## Task 12: Integration & Deployment

### 12.1 Integration Testing
- [ ] Test full flow: trend discovery → content generation → publishing
- [ ] Test with real LLM APIs (OpenAI and Anthropic)
- [ ] Test scheduled workflow execution
- [ ] Test error scenarios and recovery
- [ ] Test with real database
- [ ] Verify workflow runs are tracked correctly

### 12.2 Performance Testing
- [ ] Test workflow execution times
- [ ] Test concurrent workflow execution
- [ ] Test with large datasets (1000+ trends)
- [ ] Optimize slow operations
- [ ] Add performance metrics logging

### 12.3 Final Validation
- [ ] Run TypeScript type checking (`pnpm tsc --noEmit`)
- [ ] Run linter (`pnpm lint`)
- [ ] Run formatter (`pnpm format`)
- [ ] Run full test suite
- [ ] Verify all OpenSpec requirements are met
- [ ] Run `openspec validate mastra-integration --strict`

### 12.4 Deployment Preparation
- [ ] Update deployment documentation
- [ ] Add production environment variables guide
- [ ] Document LLM API key setup
- [ ] Add monitoring and alerting setup guide
- [ ] Create deployment checklist

---

## Task 13: Commit & Push

### 13.1 Commit Changes
- [ ] Review all changes
- [ ] Stage all files: `git add -A`
- [ ] Create descriptive commit message
- [ ] Commit: `git commit -m "feat(mastra): integrate Mastra AI for workflow orchestration"`
- [ ] Verify commit includes all new files

### 13.2 Push to Remote
- [ ] Push to branch: `git push -u origin <branch-name>`
- [ ] Verify push succeeded
- [ ] Check remote repository for changes

---

## Estimated Timeline

- **Task 1-2 (Setup & Config)**: 4 hours
- **Task 3 (Tools)**: 6 hours
- **Task 4 (Agents)**: 8 hours
- **Task 5-6 (Workflows & Tracking)**: 8 hours
- **Task 7-8 (API & Cron)**: 4 hours
- **Task 9 (Error Handling)**: 3 hours
- **Task 10 (Testing)**: 8 hours
- **Task 11 (Documentation)**: 3 hours
- **Task 12 (Integration)**: 4 hours
- **Task 13 (Commit & Push)**: 1 hour

**Total**: ~49 hours (6-7 days)

Note: This is longer than the initial 24-32 hour estimate due to comprehensive testing and documentation requirements.
