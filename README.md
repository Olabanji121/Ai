# AI API Project

A full-stack Next.js application developed using **Next.js 15 + TypeScript**, **OpenSpec** (specification-driven development), and **Test-Driven Development (TDD)** with Claude Code infrastructure.

## Tech Stack

- **Node.js** v22.21.1
- **Next.js** 15.0.3 (App Router)
- **TypeScript** 5.x
- **React** 19.0.0
- **Tailwind CSS** 3.4.1
- **OpenSpec** v0.14.0 - Spec-driven development framework
- **Jest** 30.2.0 - Testing framework
- **@testing-library/react** - Component testing
- **Claude Code Infrastructure** - Automated hooks, skills, and agents

## Project Structure

```
.
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   └── api/                 # API routes
│       └── health/
│           └── route.ts     # Health check endpoint
├── __tests__/
│   └── api/
│       └── health.test.ts   # API tests
├── openspec/
│   ├── specs/               # Current specifications (source of truth)
│   ├── changes/             # Active proposals and implementations
│   ├── archive/             # Completed changes
│   └── project.md           # Project conventions
├── .claude/
│   ├── hooks/               # Automated triggers
│   ├── skills/              # Knowledge modules
│   │   ├── nextjs-api-guidelines/
│   │   ├── openspec-workflow/
│   │   └── tdd-workflow/
│   └── agents/              # Specialized task handlers
├── AGENTS.md                # AI assistant instructions
└── README.md
```

## Getting Started

### Installation

Dependencies are already installed. If needed, run:
```bash
npm install
```

### Running the Application

Development mode (with hot reload):
```bash
npm run dev
```

Visit http://localhost:3000

Build for production:
```bash
npm run build
npm start
```

## Development Workflow

This project follows a strict **OpenSpec + TDD** workflow:

### 1. OpenSpec Workflow

Before writing any code:

```bash
# Create a change proposal
mkdir -p openspec/changes/[feature-name]
```

Create these files:
- `proposal.md` - Why and what you're building
- `specs/` - Detailed specifications
- `tasks.md` - Implementation checklist

### 2. Test-Driven Development (TDD)

Every feature follows the TDD cycle:

```
RED → GREEN → REFACTOR
```

1. **RED**: Write a failing test
   ```bash
   npm run test:watch
   ```

2. **GREEN**: Write minimal code to pass the test

3. **REFACTOR**: Improve code while tests stay green

### 3. Implementation

Example workflow:
```bash
# 1. Write test first
# Create __tests__/api/users.test.ts

# 2. Run test (should fail)
npm test

# 3. Implement API route
# Create app/api/users/route.ts

# 4. Make test pass
npm test

# 5. Archive when done
openspec archive [feature-name]
```

## Testing

### Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode (for TDD):
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Test Structure

Tests live in `__tests__/`:
- `__tests__/api/` - API route tests
- `__tests__/components/` - Component tests

### Example Test

```typescript
import { GET } from '@/app/api/health/route';

describe('/api/health', () => {
  it('should return status 200', async () => {
    const response = await GET(new Request('http://localhost'));
    expect(response.status).toBe(200);
  });
});
```

## API Development

### Creating an API Route

1. Write OpenSpec in `openspec/changes/[feature]/specs/`
2. Write failing test in `__tests__/api/`
3. Create route handler in `app/api/[endpoint]/route.ts`
4. Implement and make tests pass
5. Archive the change

### API Route Example

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ data: [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ data: body }, { status: 201 });
}
```

## Claude Code Infrastructure

This project includes automated Claude Code infrastructure:

### Skills (Auto-Activated)

Skills automatically suggest best practices:
- **nextjs-api-guidelines** - Next.js API patterns
- **openspec-workflow** - Spec-driven development
- **tdd-workflow** - Test-driven development

### Agents (On-Demand)

Specialized agents for complex tasks:
- **code-architecture-reviewer** - Reviews architecture
- **code-refactor-master** - Guides refactoring
- **auto-error-resolver** - Debugging assistance

### Hooks

- **skill-activation-prompt** - Auto-suggests relevant skills

## Available Commands

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - TDD watch mode
- `npm run test:coverage` - Coverage report

### OpenSpec
- `openspec archive [change-name]` - Archive completed change

## Available Endpoints

### GET /api/health
Health check endpoint that returns API status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T05:00:00.000Z"
}
```

**Test:** 3/3 tests passing ✅

## Key Principles

1. **Specifications drive implementation** - No code without OpenSpec proposal
2. **Tests before code** - Always follow TDD (Red → Green → Refactor)
3. **TypeScript strict mode** - Properly type everything
4. **Next.js App Router** - Use server components by default
5. **80% minimum coverage** - Maintain high test coverage

## Quality Gates

Before committing:
- ✅ All tests pass (`npm test`)
- ✅ TypeScript compiles (`npm run build`)
- ✅ Linting passes (`npm run lint`)
- ✅ OpenSpec specs are up to date
- ✅ Code follows conventions (`openspec/project.md`)

## Documentation

- `AGENTS.md` - Comprehensive AI assistant instructions
- `openspec/project.md` - Project conventions and standards
- `.claude/skills/` - Development guidelines and patterns

## Contributing

When adding new features:
1. Create an OpenSpec change proposal first
2. Follow TDD principles - write tests first
3. Implement the feature incrementally
4. Ensure all tests pass and TypeScript compiles
5. Archive the change to merge specs
6. Update documentation as needed

**Key Principle**: Specifications drive implementation. No code without specs and tests.

## License

ISC
