# AI API Project

A Node.js API project developed using **OpenSpec** (specification-driven development) and **Test-Driven Development (TDD)**.

## Tech Stack

- **Node.js** v22.21.1
- **Express** - Web framework
- **OpenSpec** v0.14.0 - Spec-driven development framework
- **Swagger UI** - API documentation interface
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library

## Project Structure

```
.
├── openspec/
│   ├── specs/            # Current specifications (source of truth)
│   ├── changes/          # Active proposals and implementations
│   ├── archive/          # Completed changes
│   └── project.md        # Project conventions
├── src/
│   ├── index.js          # Main server file
│   └── openapi.yaml      # OpenAPI specification (for Swagger UI)
├── tests/
│   └── health.test.js    # Sample test file
├── AGENTS.md             # AI assistant instructions
├── package.json
└── README.md
```

## Getting Started

### Installation

Dependencies are already installed. If needed, run:
```bash
npm install
```

### Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

### API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api-docs

## Test-Driven Development (TDD)

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

### TDD Workflow

1. Write a failing test first
2. Write minimal code to make the test pass
3. Refactor the code
4. Repeat

Example test location: `tests/health.test.js`

## OpenSpec Workflow

This project uses OpenSpec for specification-driven development. All features follow a structured workflow.

### Adding New Features

1. **Create a Change Proposal**:
   ```bash
   mkdir -p openspec/changes/[feature-name]
   ```
   - Write `proposal.md` (why and what)
   - Define specs in `specs/` folder
   - Create `tasks.md` checklist

2. **Follow TDD Cycle**:
   - **Red**: Write failing tests first
   - **Green**: Write minimal code to pass
   - **Refactor**: Improve while tests stay green

3. **Implement Feature**:
   - Create test file in `tests/`
   - Add route handler in `src/`
   - Update `src/openapi.yaml` for API docs

4. **Archive Completed Work**:
   ```bash
   openspec archive [feature-name]
   ```
   - Merges specs into `openspec/specs/`

See `AGENTS.md` for detailed workflow instructions.

## Available Endpoints

### GET /health
Health check endpoint that returns API status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T05:00:00.000Z"
}
```

## Contributing

When adding new features:
1. Create an OpenSpec change proposal first
2. Follow TDD principles - write tests first
3. Implement the feature incrementally
4. Ensure all tests pass
5. Archive the change to merge specs
6. Update API documentation in `src/openapi.yaml`

**Key Principle**: Specifications drive implementation. No code without specs and tests.

## License

ISC
