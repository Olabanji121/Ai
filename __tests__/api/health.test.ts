import { GET } from '@/app/api/health/route';

describe('/api/health', () => {
  it('should return status 200', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it('should return JSON with status ok', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('status', 'ok');
  });

  it('should return a timestamp', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('timestamp');
    expect(new Date(data.timestamp)).toBeInstanceOf(Date);
  });
});
