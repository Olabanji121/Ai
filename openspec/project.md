# AI API Project

## Overview
A full-stack Next.js application developed using OpenSpec specification-driven development and Test-Driven Development (TDD).

## Tech Stack
- **Runtime**: Node.js v22.21.1
- **Framework**: Next.js 15.0.3 (App Router)
- **Language**: TypeScript 5.x
- **Testing**: Jest 30.2.0 with @testing-library/react
- **Styling**: Tailwind CSS 3.4.1
- **Specification**: OpenSpec for spec-driven development

## Development Philosophy

### Spec-Driven Development
All features must follow the OpenSpec workflow:
1. Create a proposal in `openspec/changes/[change-name]/proposal.md`
2. Define specifications in `openspec/changes/[change-name]/specs/`
3. Create implementation tasks in `openspec/changes/[change-name]/tasks.md`
4. Implement following TDD principles
5. Archive completed changes

### Test-Driven Development (TDD)
Every feature must follow the TDD cycle:
1. **Red**: Write a failing test first
2. **Green**: Write minimal code to pass the test
3. **Refactor**: Improve code quality while keeping tests green

## Project Conventions

### Code Structure (Next.js App Router)
```
app/
  ├── layout.tsx           # Root layout
  ├── page.tsx             # Home page
  ├── globals.css          # Global styles
  ├── api/                 # API routes
  │   └── [endpoint]/
  │       └── route.ts     # API handlers (GET, POST, etc.)
  ├── [feature]/           # Feature pages
  │   ├── page.tsx         # Feature page
  │   └── components/      # Feature-specific components
  └── components/          # Shared components

__tests__/
  ├── api/                 # API route tests
  │   └── [endpoint].test.ts
  └── components/          # Component tests
      └── [Component].test.tsx
```

### TypeScript Standards
- Use strict mode
- Define proper types/interfaces
- Avoid `any` unless absolutely necessary
- Use type inference where appropriate
- Export types from components and utilities

### Testing Standards
- All API routes must have test coverage
- All components should have tests
- Tests must be in `__tests__/` directory
- Use Jest for unit/integration tests
- Use @testing-library/react for component tests
- Minimum coverage: 80%

### API Route Standards (Next.js App Router)
- Use route handlers (route.ts files)
- Export named functions: GET, POST, PUT, DELETE, PATCH
- Return NextResponse.json() for JSON responses
- Proper HTTP status codes
- Type request/response payloads
- Input validation with TypeScript
- Error handling with try/catch

### Component Standards
- Use TypeScript for all components
- Define prop interfaces
- Use 'use client' directive for client components
- Server components by default
- Proper SEO with metadata

### Styling Standards
- Tailwind CSS utility classes
- Avoid inline styles
- Use Tailwind config for custom themes
- Mobile-first responsive design

### Commit Standards
- Write clear, descriptive commit messages
- Reference OpenSpec change proposals in commits
- Ensure all tests pass before committing
- Run `npm run lint` before committing

## Quality Gates
- All tests must pass (`npm test`)
- TypeScript must compile without errors (`npm run build`)
- Linting must pass (`npm run lint`)
- Code follows project conventions
- OpenSpec specifications are up to date

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run lint` - Run ESLint
