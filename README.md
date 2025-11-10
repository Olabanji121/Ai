# AI API Project

A Node.js API project developed using **OpenAPI Specification** and **Test-Driven Development (TDD)**.

## Tech Stack

- **Node.js** v22.21.1
- **Express** - Web framework
- **OpenAPI 3.0** - API specification
- **Swagger UI** - API documentation interface
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library

## Project Structure

```
.
├── src/
│   ├── index.js          # Main server file
│   └── openapi.yaml      # OpenAPI specification
├── tests/
│   └── health.test.js    # Sample test file
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

## OpenAPI Specification

The API is defined using OpenAPI 3.0 specification in `src/openapi.yaml`.

### Adding New Endpoints

1. **Write the test first** (TDD approach):
   - Create a new test file in `tests/`
   - Write tests for the expected behavior

2. **Update OpenAPI spec**:
   - Add the endpoint definition to `src/openapi.yaml`

3. **Implement the endpoint**:
   - Add the route handler in `src/index.js`
   - Run tests to verify

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
1. Follow TDD principles - write tests first
2. Update the OpenAPI specification
3. Implement the feature
4. Ensure all tests pass
5. Update documentation

## License

ISC
