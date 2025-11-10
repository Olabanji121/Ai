const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('js-yaml');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Load OpenAPI specification
const openApiPath = path.join(__dirname, 'openapi.yaml');
const openApiDocument = YAML.load(fs.readFileSync(openApiPath, 'utf8'));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Start server only if not in test environment
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
