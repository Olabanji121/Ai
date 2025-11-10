const request = require('supertest');
const app = require('../src/index');

describe('Health Check Endpoint', () => {
  describe('GET /health', () => {
    it('should return status 200', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/health');
      expect(response.type).toBe('application/json');
    });

    it('should return status ok', async () => {
      const response = await request(app).get('/health');
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should return a timestamp', async () => {
      const response = await request(app).get('/health');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });
});
