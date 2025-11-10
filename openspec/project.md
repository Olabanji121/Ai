# AI API Project

## Overview
A Node.js API project developed using OpenSpec specification-driven development and Test-Driven Development (TDD).

## Tech Stack
- **Runtime**: Node.js v22.21.1
- **Framework**: Express 5.1.0
- **Testing**: Jest 30.2.0 with Supertest
- **Specification**: OpenSpec for spec-driven development
- **API Documentation**: Swagger UI

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

### Code Structure
```
src/
  ├── index.js         # Main server entry point
  ├── routes/          # Route handlers
  ├── controllers/     # Business logic
  ├── models/          # Data models
  └── middleware/      # Express middleware

tests/
  └── [feature].test.js  # Test files mirroring src structure
```

### Testing Standards
- All endpoints must have test coverage
- Tests must be in `tests/` directory
- Use Jest for unit tests
- Use Supertest for integration/API tests
- Minimum coverage: 80%

### API Standards
- RESTful design principles
- JSON request/response format
- Proper HTTP status codes
- Error handling middleware
- Input validation

### Commit Standards
- Write clear, descriptive commit messages
- Reference OpenSpec change proposals in commits
- Ensure all tests pass before committing

## Quality Gates
- All tests must pass (`npm test`)
- Code follows project conventions
- OpenSpec specifications are up to date
