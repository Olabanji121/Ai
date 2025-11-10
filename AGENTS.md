# AI Agent Instructions

This project uses **Next.js 15 + TypeScript** with **OpenSpec** for specification-driven development and **Test-Driven Development (TDD)**.

## Tech Stack

- **Framework**: Next.js 15.0.3 (App Router)
- **Language**: TypeScript 5.x
- **Testing**: Jest 30.2.0
- **Styling**: Tailwind CSS 3.4.1
- **Specification**: OpenSpec v0.14.0
- **Infrastructure**: Claude Code hooks, skills, and agents

## Claude Code Infrastructure

This project includes automated Claude Code infrastructure:

### Skills (Auto-Activated)

Skills are automatically suggested based on context:

- **nextjs-api-guidelines**: Activated when working with API routes
- **openspec-workflow**: Activated when creating/editing specs
- **tdd-workflow**: Activated when writing tests

To manually invoke a skill, the user can type: `/skill [skill-name]`

### Agents (On-Demand)

Agents handle specialized tasks:

- **code-architecture-reviewer**: Reviews architectural decisions
- **code-refactor-master**: Guides refactoring efforts
- **auto-error-resolver**: Helps debug and resolve errors

Users invoke agents via: `/agent [agent-name]`

### Hooks (Automatic)

- **skill-activation-prompt**: Auto-suggests relevant skills based on file changes and prompts

## OpenSpec Workflow

### Before Starting Any Feature

1. **Create a Change Proposal**
   ```bash
   mkdir -p openspec/changes/[feature-name]
   ```
   - Write `proposal.md` explaining why and what
   - Define specs in `openspec/changes/[feature-name]/specs/`
   - Create `tasks.md` with implementation checklist

2. **Review and Refine**
   - Ensure proposal aligns with `openspec/project.md` conventions
   - Get stakeholder agreement on specifications
   - Clarify any ambiguities before coding

3. **Implement with TDD**
   - Write failing tests first
   - Implement minimal code to pass tests
   - Refactor while keeping tests green
   - Follow task checklist in `tasks.md`

4. **Archive Completed Changes**
   ```bash
   openspec archive [feature-name]
   ```
   - This merges specs into `openspec/specs/`

## TDD Cycle

Every feature implementation must follow:

```
RED → GREEN → REFACTOR
```

1. **RED**: Write a failing test
   - Create test file in `__tests__/`
   - Run `npm test` to verify it fails
   - Test should define expected behavior

2. **GREEN**: Make test pass
   - Write minimal implementation
   - Run `npm test` until it passes
   - Don't optimize yet

3. **REFACTOR**: Improve code
   - Clean up implementation
   - Remove duplication
   - Improve readability
   - Tests must still pass

## Project Structure

```
app/
├── layout.tsx           # Root layout
├── page.tsx             # Home page
├── globals.css          # Global styles
├── api/                 # API routes
│   └── [endpoint]/
│       └── route.ts     # API handlers (GET, POST, etc.)
└── components/          # Shared components

__tests__/
├── api/                 # API route tests
│   └── [endpoint].test.ts
└── components/          # Component tests
    └── [Component].test.tsx

openspec/
├── specs/              # Current specifications (source of truth)
├── changes/            # Active proposals and implementations
├── archive/            # Completed changes
└── project.md          # Project conventions

.claude/
├── hooks/              # Automated triggers
├── skills/             # Knowledge modules
│   ├── nextjs-api-guidelines/
│   ├── openspec-workflow/
│   └── tdd-workflow/
├── agents/             # Specialized task handlers
└── skills/
    └── skill-rules.json  # Skill activation rules
```

## Next.js API Development

### Creating an API Route

1. **Write OpenSpec** (in `openspec/changes/[feature]/specs/`)
2. **Write failing test** (`__tests__/api/[endpoint].test.ts`)
3. **Create route handler** (`app/api/[endpoint]/route.ts`)
4. **Implement** and make tests pass
5. **Archive** the change

### API Route Template

```typescript
// app/api/[endpoint]/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface RequestBody {
  // Define request type
}

interface ResponseBody {
  // Define response type
}

export async function GET(request: NextRequest) {
  try {
    // Implementation
    return NextResponse.json<ResponseBody>({ /* data */ });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    // Validation
    if (!body./* field */) {
      return NextResponse.json(
        { error: 'Validation error' },
        { status: 400 }
      );
    }

    // Implementation
    return NextResponse.json<ResponseBody>(
      { /* data */ },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Test Template

```typescript
// __tests__/api/[endpoint].test.ts
import { GET, POST } from '@/app/api/[endpoint]/route';

describe('/api/[endpoint]', () => {
  describe('GET', () => {
    it('should return 200 and data', async () => {
      const response = await GET(new Request('http://localhost'));
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toBeDefined();
    });
  });

  describe('POST', () => {
    it('should create resource and return 201', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ /* test data */ }),
      });

      const response = await POST(request as any);
      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as any);
      expect(response.status).toBe(400);
    });
  });
});
```

## Available Commands

### Development
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - TDD watch mode (auto-run on file changes)
- `npm run test:coverage` - Generate coverage report

### OpenSpec
- `openspec archive [change-name]` - Archive completed change

## Important Rules

1. **No Code Without Specs**: Create OpenSpec proposal before implementing
2. **No Code Without Tests**: Always write tests first (TDD)
3. **Keep Specs Updated**: Specifications are the source of truth
4. **Run Tests Often**: Tests should pass before commits
5. **Follow Conventions**: Check `openspec/project.md` for standards
6. **Use TypeScript**: Properly type everything, avoid `any`
7. **Leverage Skills**: Skills auto-activate to guide development

## Example Workflow

```bash
# 1. Create new feature proposal
mkdir -p openspec/changes/add-user-management
# Write proposal.md, specs/, and tasks.md

# 2. Start TDD workflow
npm run test:watch

# 3. Write failing test
# Create __tests__/api/users.test.ts

# 4. Implement API route
# Create app/api/users/route.ts

# 5. Refactor and ensure tests pass
npm test

# 6. Build and lint
npm run build
npm run lint

# 7. Commit changes
git add .
git commit -m "Add user management (openspec: add-user-management)"

# 8. Archive completed change
openspec archive add-user-management
```

## Integration with AI Assistants

This file is automatically read by AI coding assistants like:
- Claude Code ✓ (you're using this now)
- Cursor
- GitHub Copilot
- Cline

The `.claude/` infrastructure provides automated skill suggestions and agent assistance.

When working with AI assistants, they will:
1. Follow OpenSpec workflow automatically
2. Apply TDD principles
3. Use TypeScript standards
4. Leverage Next.js App Router patterns
5. Activate relevant skills based on context

## Quality Gates

Before committing:
- ✅ All tests pass (`npm test`)
- ✅ TypeScript compiles (`npm run build`)
- ✅ Linting passes (`npm run lint`)
- ✅ Code follows conventions (`openspec/project.md`)
- ✅ OpenSpec specs are up to date
- ✅ Minimum 80% test coverage

**Remember**: Specifications drive implementation. Tests verify specifications. Code implements what tests specify.
