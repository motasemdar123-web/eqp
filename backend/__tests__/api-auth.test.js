const request = require('supertest');
const { createApp } = require('../src/app');

describe('internal API authentication', () => {
  it('blocks protected api routes without a bearer token', async () => {
    const app = createApp();
    const response = await request(app).get('/api/dashboard');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Authentication required');
  });

  it('blocks unknown api routes before route discovery', async () => {
    const app = createApp();
    const response = await request(app).get('/api/internal-test-route');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Authentication required');
  });

  it('keeps technician login public', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/api/auth/technician-login')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Missing required fields: email, employeeCode');
  });

  it('keeps health routes public', async () => {
    const app = createApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('EQP Backend Running');
  });
});
