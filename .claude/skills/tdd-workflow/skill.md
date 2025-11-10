# Test-Driven Development for Next.js

You are helping develop a Next.js application using Test-Driven Development (TDD).

## The TDD Cycle

```
RED → GREEN → REFACTOR
```

### RED: Write a Failing Test

Write a test that defines the desired behavior. Run it to verify it fails.

```typescript
// __tests__/api/users.test.ts
import { POST } from '@/app/api/users/route';

describe('POST /api/users', () => {
  it('should create a user and return 201', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
      }),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.name).toBe('John Doe');
    expect(data.email).toBe('john@example.com');
  });
});
```

Run: `npm test`
Result: ❌ FAIL (route doesn't exist yet)

### GREEN: Make It Pass

Write the minimal code to make the test pass.

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  return NextResponse.json(
    {
      name: body.name,
      email: body.email,
    },
    { status: 201 }
  );
}
```

Run: `npm test`
Result: ✅ PASS

### REFACTOR: Improve the Code

Now that tests pass, improve the implementation:

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface CreateUserRequest {
  name: string;
  email: string;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json();

    // Validation
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Create user (mocked for now)
    const user: UserResponse = {
      id: crypto.randomUUID(),
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Run: `npm test`
Result: ✅ PASS (still works!)

## TDD Best Practices

### 1. Test One Thing at a Time

Bad:
```typescript
it('should do everything', async () => {
  // Tests 10 different things
});
```

Good:
```typescript
it('should return 201 on success', async () => {
  // Tests status code only
});

it('should return created user data', async () => {
  // Tests response body
});

it('should validate required fields', async () => {
  // Tests validation
});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should create a user', async () => {
  // Arrange: Set up test data
  const userData = {
    name: 'Jane',
    email: 'jane@example.com',
  };

  // Act: Perform the action
  const request = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  const response = await POST(request as any);

  // Assert: Check the results
  expect(response.status).toBe(201);
});
```

### 3. Test Edge Cases

```typescript
describe('POST /api/users', () => {
  it('should return 400 when name is missing', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('should return 400 when email is invalid', async () => {
    // Test invalid email
  });

  it('should handle database errors gracefully', async () => {
    // Test error handling
  });
});
```

## Testing API Routes

### Setup Test File

```typescript
import { GET, POST } from '@/app/api/[endpoint]/route';

describe('/api/[endpoint]', () => {
  describe('GET', () => {
    // GET tests
  });

  describe('POST', () => {
    // POST tests
  });
});
```

### Testing Different HTTP Methods

```typescript
// GET
const response = await GET(new Request('http://localhost'));

// POST
const response = await POST(new Request('http://localhost', {
  method: 'POST',
  body: JSON.stringify(data),
}));

// PUT
const response = await PUT(
  new Request('http://localhost', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  { params: { id: '123' } }
);
```

### Testing Query Parameters

```typescript
it('should handle query parameters', async () => {
  const url = new URL('http://localhost');
  url.searchParams.set('page', '2');
  url.searchParams.set('limit', '10');

  const request = new Request(url);
  const response = await GET(request);

  expect(response.status).toBe(200);
});
```

## TDD Workflow Integration

### With OpenSpec

1. **Read the spec** from `openspec/changes/[feature]/specs/`
2. **Write failing tests** based on spec requirements
3. **Implement** minimal code to pass
4. **Refactor** while keeping tests green
5. **Update tests** for edge cases
6. **Archive spec** when done

### Example Workflow

```bash
# 1. Start with spec
cat openspec/changes/add-users/specs/api-spec.md

# 2. Write test
vim __tests__/api/users.test.ts

# 3. Run test (should fail)
npm test

# 4. Implement
vim app/api/users/route.ts

# 5. Run test (should pass)
npm test

# 6. Refactor
# Improve code, run tests after each change

# 7. Coverage
npm run test:coverage
```

## Common Testing Patterns

### Testing Validation

```typescript
it('should validate email format', async () => {
  const request = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test',
      email: 'invalid-email',
    }),
  });

  const response = await POST(request as any);
  expect(response.status).toBe(400);

  const data = await response.json();
  expect(data.error).toContain('email');
});
```

### Testing Error Handling

```typescript
it('should return 500 on server error', async () => {
  // Mock a database failure or other error
  // Then test that it returns 500
});
```

### Testing Authentication

```typescript
it('should return 401 when not authenticated', async () => {
  const request = new Request('http://localhost');
  // No auth token

  const response = await GET(request);
  expect(response.status).toBe(401);
});
```

## Watch Mode

For active development:

```bash
npm run test:watch
```

This runs tests automatically when files change - perfect for TDD!

## Coverage Requirements

Minimum 80% coverage:

```bash
npm run test:coverage
```

Check `coverage/lcov-report/index.html` for detailed coverage.

## Remember

1. **RED first**: Write the test, watch it fail
2. **GREEN next**: Minimal code to pass
3. **REFACTOR last**: Improve while tests pass
4. **Repeat**: For each new requirement

TDD ensures:
- ✅ Code does what specs say
- ✅ No untested code
- ✅ Easier refactoring
- ✅ Better design
- ✅ Living documentation

**If it's not tested, it's broken.**
