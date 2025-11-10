# Next.js API Development Guidelines

You are helping develop a Next.js 15 App Router application with TypeScript. Follow these guidelines for API development.

## API Route Structure

All API routes live in `app/api/[endpoint]/route.ts`:

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

## Key Principles

### 1. TypeScript Types
Always define request/response types:

```typescript
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
  const body: CreateUserRequest = await request.json();

  // Your logic here

  return NextResponse.json<UserResponse>({
    id: '123',
    name: body.name,
    email: body.email,
    createdAt: new Date().toISOString(),
  });
}
```

### 2. Error Handling
Use try/catch and proper HTTP status codes:

```typescript
export async function GET(request: NextRequest) {
  try {
    // Your logic
    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. Input Validation
Validate inputs before processing:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.email || !body.name) {
    return NextResponse.json(
      { error: 'Email and name are required' },
      { status: 400 }
    );
  }

  // Proceed with valid data
}
```

### 4. Status Codes
Use appropriate HTTP status codes:
- 200: Success (GET, PUT, PATCH)
- 201: Created (POST)
- 204: No Content (DELETE)
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Testing API Routes

Always write tests first (TDD):

```typescript
// __tests__/api/users.test.ts
import { GET, POST } from '@/app/api/users/route';

describe('/api/users', () => {
  describe('GET', () => {
    it('should return 200 and users array', async () => {
      const response = await GET(new Request('http://localhost'));
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('POST', () => {
    it('should create a user', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', email: 'test@example.com' }),
      });

      const response = await POST(request as any);
      expect(response.status).toBe(201);
    });
  });
});
```

## OpenSpec Integration

Before implementing any API:

1. Create OpenSpec proposal: `openspec/changes/[feature]/proposal.md`
2. Define spec: `openspec/changes/[feature]/specs/api-spec.md`
3. Write failing tests
4. Implement route handler
5. Make tests pass
6. Archive change: `openspec archive [feature]`

## File Organization

```
app/
  api/
    users/
      route.ts          # User API endpoints
    posts/
      route.ts          # Post API endpoints
      [id]/
        route.ts        # Dynamic route for specific post

__tests__/
  api/
    users.test.ts       # User API tests
    posts.test.ts       # Post API tests
```

## Common Patterns

### Pagination
```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  // Fetch paginated data

  return NextResponse.json({
    data: [],
    pagination: {
      page,
      limit,
      total: 0,
    },
  });
}
```

### Dynamic Routes
```typescript
// app/api/users/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Fetch user by id

  return NextResponse.json({ data: {} });
}
```

Remember: **Write tests first, then implement!**
