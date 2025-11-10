# OpenSpec Workflow for Next.js Development

You are helping develop a Next.js application using OpenSpec for specification-driven development.

## OpenSpec Philosophy

**Specifications drive implementation.** No code without specs and tests.

## The OpenSpec Workflow

### 1. Create a Change Proposal

Before writing any code, create a proposal:

```bash
mkdir -p openspec/changes/[feature-name]
```

Create three files:

#### `openspec/changes/[feature-name]/proposal.md`
```markdown
# [Feature Name]

## Why
Explain the business need or problem this solves.

## What
Describe what you're building at a high level.

## Scope
What's included and what's not.

## Success Criteria
How do you know when this is done?
```

#### `openspec/changes/[feature-name]/specs/`
Create detailed specifications:

```markdown
# API Specification: Create User

## Endpoint
POST /api/users

## Request
\`\`\`typescript
interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}
\`\`\`

## Validation
- email: must be valid email format
- password: minimum 8 characters
- name: required, 2-50 characters

## Response (Success)
Status: 201
\`\`\`json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "createdAt": "ISO 8601"
}
\`\`\`

## Error Responses
- 400: Invalid input
- 409: Email already exists
- 500: Server error
```

#### `openspec/changes/[feature-name]/tasks.md`
```markdown
# Implementation Tasks

- [ ] Write failing test for POST /api/users
- [ ] Create route handler app/api/users/route.ts
- [ ] Implement validation
- [ ] Add error handling
- [ ] Make tests pass
- [ ] Add integration test
- [ ] Update OpenAPI docs if needed
```

### 2. Follow TDD Cycle

With specs defined:

1. **Red**: Write failing test based on spec
2. **Green**: Implement minimal code to pass
3. **Refactor**: Clean up while tests stay green

### 3. Implementation Checklist

Before coding:
- ✅ Proposal created and reviewed
- ✅ Specifications defined
- ✅ Tasks listed
- ✅ Tests written (failing)

During coding:
- ✅ Follow TypeScript standards
- ✅ Follow Next.js conventions
- ✅ All tests passing
- ✅ Code reviewed

### 4. Archive Completed Changes

When done:

```bash
openspec archive [feature-name]
```

This merges specs into `openspec/specs/` as source of truth.

## Directory Structure

```
openspec/
├── project.md              # Project conventions
├── specs/                  # Source of truth
│   └── api/
│       └── users.md        # Archived user spec
├── changes/                # Active work
│   └── add-user-auth/
│       ├── proposal.md
│       ├── specs/
│       │   └── auth-api.md
│       └── tasks.md
└── archive/                # Completed changes
    └── add-user-auth/      # Archived after completion
```

## Example: Adding a New Feature

**Task**: Add user authentication

### Step 1: Create Proposal
```bash
mkdir -p openspec/changes/add-user-auth
```

Write proposal.md explaining why you need auth and what it includes.

### Step 2: Write Specs

`openspec/changes/add-user-auth/specs/auth-api.md`:
- Login endpoint spec
- Logout endpoint spec
- Token refresh spec
- Error handling
- Security requirements

### Step 3: Create Tasks

`openspec/changes/add-user-auth/tasks.md`:
- [ ] Test: POST /api/auth/login
- [ ] Test: POST /api/auth/logout
- [ ] Implement login handler
- [ ] Implement logout handler
- [ ] Add JWT middleware
- [ ] Integration tests

### Step 4: TDD Implementation

```typescript
// __tests__/api/auth/login.test.ts
describe('POST /api/auth/login', () => {
  it('should return 200 and token for valid credentials', async () => {
    // This test will fail - that's good!
    const response = await POST(/* ... */);
    expect(response.status).toBe(200);
  });
});
```

```typescript
// app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  // Minimal implementation to pass test
}
```

### Step 5: Archive

```bash
openspec archive add-user-auth
```

## Key Principles

1. **Specs before code**: Always define what you're building first
2. **Tests before implementation**: TDD ensures specs are testable
3. **Incremental**: One feature at a time
4. **Documented**: Specs become living documentation
5. **Auditable**: Complete history in openspec/

## When to Create a Change

- ✅ New feature
- ✅ Significant refactoring
- ✅ API changes
- ✅ Architecture changes

Don't create for:
- ❌ Typo fixes
- ❌ Minor style updates
- ❌ Small bug fixes (unless they require spec changes)

Remember: OpenSpec keeps humans and AI aligned on **what** to build before building it!
