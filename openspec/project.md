# Project Context

## Purpose

**AutoMarketeer** is an AI-powered marketing automation platform that:
- Discovers trending topics from Reddit, Twitter, and Google Trends
- Generates platform-optimized content using AI agents
- Manages multi-platform publishing with intelligent scheduling
- Learns from engagement metrics to improve over time
- Provides human-in-the-loop approval workflow for content review

**Core Value Proposition:**
Automate the entire content marketing pipeline from trend discovery to publishing and analytics, while maintaining brand voice and quality control.

## Tech Stack

### Framework & Runtime
- **Next.js 15** - App Router with Server Actions and React Server Components
- **TypeScript 5+** - Full type safety across the codebase
- **Node.js 20+** - Runtime environment

### AI & Agents
- **Mastra AI** - Agent orchestration, workflows, and memory management
- **OpenAI GPT-4o** - Content generation and analysis
- **Anthropic Claude Sonnet 4** - Advanced content creation
- **AI SDK** - `@ai-sdk/openai`, `@ai-sdk/anthropic`

### Database & Storage
- **Supabase** - PostgreSQL database with pgvector support
- **Drizzle ORM** - Type-safe database queries and migrations
- **Redis** - Caching layer (via Upstash or self-hosted)

### Background Jobs & Workflows
- **BullMQ** or **pg-boss** - Queue management for async tasks
- **Mastra Workflows** - Multi-step AI workflow orchestration

### Authentication & Authorization
- **Better Auth** - Modern authentication system

### External APIs & Services
- **Ayrshare API** - Multi-platform social media publishing
- **Reddit API** - Trend discovery from subreddits
- **Google Trends** - Trending search queries
- **DataForSEO** (optional) - SEO and keyword data

### UI & Styling
- **shadcn/ui** - Component library built on Radix UI
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Icon system

### Development Tools
- **Vitest** - Unit and integration testing
- **Playwright** - End-to-end testing
- **ESLint + Prettier** - Code linting and formatting
- **Husky** - Git hooks for pre-commit checks

### Deployment & Infrastructure
- **Vercel** - Hosting and serverless functions
- **GitHub Actions** - CI/CD pipeline
- **OpenTelemetry** - Observability and tracing

## Project Conventions

### Code Style

**General Principles:**
- Write clean, readable, self-documenting code
- Prefer explicit over implicit
- Use descriptive variable and function names
- Keep functions small and focused (single responsibility)
- Avoid premature optimization

**TypeScript:**
- Use strict mode (`"strict": true`)
- Define explicit types, avoid `any`
- Use interfaces for object shapes, types for unions/primitives
- Export types alongside implementations
- Use zod schemas for runtime validation

**Naming Conventions:**
- **Files:** `kebab-case.ts`, `component-name.tsx`
- **Components:** `PascalCase` (e.g., `TrendCard`, `PostReviewPanel`)
- **Functions/Variables:** `camelCase` (e.g., `getTrends`, `isApproved`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `API_BASE_URL`)
- **Private methods:** Prefix with `_` (e.g., `_internalHelper`)
- **Types/Interfaces:** `PascalCase` (e.g., `TrendData`, `PostStatus`)

**File Organization:**
```typescript
// 1. Imports (grouped: external, internal, types)
import { useState } from 'react'
import { db } from '@/lib/db'
import type { Trend } from '@/types/database'

// 2. Types and interfaces
interface Props {
  trendId: string
}

// 3. Constants
const MAX_RETRIES = 3

// 4. Main implementation
export function Component({ trendId }: Props) {
  // ...
}

// 5. Helper functions (at bottom or separate file)
function helper() {
  // ...
}
```

**Comments:**
- Write comments for "why", not "what"
- Use JSDoc for public APIs
- Mark TODOs with `// TODO: description`
- Mark temporary code with `// FIXME: reason`

### Architecture Patterns

**3-Layer Modular Architecture:**

```
Layer 1: Core Modules (Infrastructure)
├── Database Module - Repository pattern for data access
├── Configuration Module - Centralized config with validation
├── Logger Module - Structured logging
├── Error Handler Module - Global error handling
├── Cache Module - Redis-based caching
└── Queue Module - Background job processing

Layer 2: Service Modules (Business Logic)
├── Trend Discovery Service - Scrape and analyze trends
├── Content Generation Service - AI-powered content creation
├── Publishing Service - Multi-platform publishing
├── Analytics Service - Performance metrics and insights
└── Workflow Service - Orchestrate multi-step processes

Layer 3: Interface Modules (External)
├── REST API - Next.js API routes
├── Web Dashboard - React components and pages
└── CLI (optional) - Command-line tools
```

**Design Patterns:**
- **Repository Pattern** - All database access goes through repositories
- **Service Pattern** - Business logic in service classes
- **Factory Pattern** - Create AI agents and tools
- **Strategy Pattern** - Platform-specific content generation
- **Observer Pattern** - Workflow step notifications

**Dependency Injection:**
- Services receive dependencies via constructor
- Use dependency injection for testability
- Avoid global state where possible

**Error Handling:**
- Use custom error classes (ValidationError, ExternalAPIError, etc.)
- Centralized error handling middleware
- Structured error logging with context
- User-friendly error messages in API responses

### Testing Strategy

**Test Coverage Requirements:**
- **Unit Tests:** 90%+ coverage for all modules
- **Integration Tests:** 80%+ coverage for service interactions
- **E2E Tests:** Cover all critical user flows
- **Contract Tests:** Validate API contracts

**Testing Tools:**
- **Vitest** - Fast unit and integration tests
- **Playwright** - Browser-based E2E tests
- **MSW** (Mock Service Worker) - API mocking
- **c8** - Code coverage

**Testing Principles:**
- **AAA Pattern:** Arrange, Act, Assert
- **Test Isolation:** Each test is independent
- **Test Naming:** `describe('module/function')` → `it('should do X when Y')`
- **Mock External APIs:** Never call real APIs in tests
- **Fast Tests:** Unit tests < 100ms, integration < 1s

**Test Organization:**
```
src/
├── lib/
│   ├── db/
│   │   ├── index.ts
│   │   └── index.test.ts          # Co-located tests
│   └── services/
│       ├── trend-discovery.ts
│       └── trend-discovery.test.ts
└── __tests__/
    ├── integration/               # Integration tests
    └── e2e/                       # End-to-end tests
```

**Before Merging:**
- All tests must pass
- Coverage thresholds must be met
- No linting errors
- No TypeScript errors

### Git Workflow

**Branching Strategy:**
- **Main Branch:** `main` - Always production-ready
- **Feature Branches:** `claude/[feature-name]-[session-id]` - Claude Code branches
- **Hotfix Branches:** `hotfix/[issue-description]` - Critical fixes

**Commit Conventions:**
- Use [Conventional Commits](https://www.conventionalcommits.org/)
- Format: `type(scope): subject`

**Commit Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks (deps, config)
- `ci:` - CI/CD changes

**Examples:**
```bash
feat(trends): add Reddit scraper with rate limiting
fix(posts): resolve duplicate content generation bug
docs(readme): update installation instructions
refactor(database): extract repository pattern
test(analytics): add unit tests for metric calculations
```

**Pull Request Requirements:**
- Descriptive title and description
- Reference related issues
- All CI checks passing
- At least one approval (if team-based)
- Squash and merge preferred

**Branch Protection:**
- No direct commits to `main`
- Require PR reviews
- Require passing CI checks
- Require linear history

## Domain Context

### Marketing Automation Domain

**Key Concepts:**
- **Virality Score** - Measure of trending potential (0-100)
- **Engagement Rate** - (Likes + Comments + Shares) / Impressions
- **CTR (Click-Through Rate)** - Clicks / Impressions
- **Brand Voice** - Consistent tone and personality across content
- **Content Calendar** - Scheduled posts with optimal timing
- **A/B Testing** - Multiple variations to test performance
- **Sentiment Analysis** - Positive, negative, or neutral tone

**Social Media Platforms:**
1. **Twitter/X**
   - Max 280 characters
   - 2-3 hashtags optimal
   - Best times: 9am, 12pm, 3pm, 5pm ET
   - Conversational, concise tone

2. **LinkedIn**
   - 1300-2600 characters ideal
   - Professional tone
   - Best times: 8am, 12pm, 5-6pm ET
   - Value-driven, educational content

3. **Reddit**
   - No self-promotion
   - Match subreddit culture
   - Conversational, authentic
   - Best times: 6-8am, 8-10pm ET

**Content Quality Metrics:**
- **Quality Score** - AI-generated score (0-100)
- **Compliance Check** - Platform guidelines adherence
- **Brand Safety** - Controversial topic avoidance
- **Readability** - Clear, concise messaging

### AI Agent Concepts

**Mastra AI Framework:**
- **Agents** - Autonomous AI entities with specific roles
- **Tools** - Functions agents can call (API clients, scrapers)
- **Workflows** - Multi-step orchestrated processes
- **Memory** - Long-term and short-term context retention
- **Evals** - Evaluation and quality scoring

**Agent Roles:**
1. **Trend Agent** - Analyze trending topics for content opportunities
2. **Content Agent** - Generate platform-optimized content
3. **Publisher Agent** - Determine optimal publishing times and validate compliance
4. **Analytics Agent** - Analyze performance and generate insights

## Important Constraints

### Technical Constraints
- **Rate Limits:**
  - Reddit: 60 requests/minute
  - OpenAI: 10,000 TPM (tokens per minute)
  - Anthropic: 100,000 TPM
  - Ayrshare: Varies by plan

- **Database:**
  - PostgreSQL connection pool: max 10 connections
  - Query timeout: 30 seconds
  - pgvector dimensions: 1536 (OpenAI embeddings)

- **Content Limits:**
  - Twitter: 280 characters
  - LinkedIn: 3000 characters
  - Reddit: 40,000 characters

- **Performance:**
  - API response time: < 200ms (p95)
  - Workflow execution: < 5 minutes
  - Background job processing: < 30 seconds

### Business Constraints
- **Human Approval Required:**
  - All content must be reviewed before publishing (until auto-publish enabled)
  - Brand voice consistency maintained
  - No controversial or polarizing content without explicit approval

- **Cost Management:**
  - AI API costs monitored
  - Cache aggressively to reduce API calls
  - Batch operations where possible

- **Data Privacy:**
  - No storage of user passwords (Better Auth handles this)
  - Secure API key storage
  - GDPR/CCPA compliance for user data

### Regulatory Constraints
- **Social Media Policies:**
  - Comply with platform terms of service
  - No spam or automated mass posting
  - Proper disclosure for AI-generated content (if required)

- **Content Policies:**
  - No misinformation or fake news
  - No hate speech or harassment
  - No copyright infringement

## External Dependencies

### AI Providers
- **OpenAI** - GPT-4o for content generation
  - API Key required: `OPENAI_API_KEY`
  - Docs: https://platform.openai.com/docs

- **Anthropic** - Claude Sonnet 4 for advanced content
  - API Key required: `ANTHROPIC_API_KEY`
  - Docs: https://docs.anthropic.com

### Social Media Publishing
- **Ayrshare** - Multi-platform publishing API
  - API Key required: `AYRSHARE_API_KEY`
  - Supports: Twitter, LinkedIn, Reddit, Facebook, Instagram
  - Docs: https://docs.ayrshare.com

### Trend Sources
- **Reddit API** - Public JSON endpoints
  - No auth required for read-only
  - Rate limit: 60 req/min
  - Docs: https://www.reddit.com/dev/api

- **Google Trends** - Trending searches
  - Public API (unofficial)
  - No auth required
  - Rate limit: Be respectful

- **DataForSEO** (optional) - Keyword and SEO data
  - API Key required if used
  - Docs: https://dataforseo.com/apis

### Database & Storage
- **Supabase** - PostgreSQL + pgvector
  - Connection string required: `DATABASE_URL`
  - Supports: Database, Auth, Storage, Realtime
  - Docs: https://supabase.com/docs

- **Redis/Upstash** - Caching layer
  - Connection URL required: `REDIS_URL`
  - Docs: https://upstash.com/docs/redis

### Deployment & Monitoring
- **Vercel** - Hosting platform
  - Auto-deploys from GitHub
  - Environment variables managed in dashboard
  - Docs: https://vercel.com/docs

- **OpenTelemetry** (optional) - Observability
  - Tracing, metrics, logs
  - Integrations: Datadog, New Relic, etc.

### Development Dependencies
- **GitHub** - Version control and CI/CD
  - Repository: https://github.com/[org]/automarketeer
  - Actions for automated testing and deployment

---

## Notes for AI Assistants

**When working on this project:**
1. Follow the 3-layer architecture strictly
2. Always write tests for new code
3. Use TypeScript types, never `any`
4. Check external API rate limits
5. Follow OpenSpec workflow for changes
6. Use Mastra AI framework for agent logic
7. Keep modules small and focused
8. Document complex business logic
9. Always validate user input with zod
10. Use structured logging with context

**Before implementing:**
1. Create an OpenSpec change proposal
2. Get approval on specs
3. Write tests first (TDD)
4. Implement incrementally
5. Validate with the reviewer
6. Archive the change when complete
