import request from 'supertest';
import app from '../src/app.js';

describe('App Smoke and Health Tests', () => {
  it('GET / should return welcome message and status 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('InsuredMine Assessment API Service');
  });

  it('GET /api/health should return UP status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  it('GET /api/policies/search without query should return 400 validation error', async () => {
    const res = await request(app).get('/api/policies/search');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/messages/schedule without body should return 400 validation error', async () => {
    const res = await request(app).post('/api/messages/schedule').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /unknown-route should return 404', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.statusCode).toBe(404);
  });
});
