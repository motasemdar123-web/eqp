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

  describe('forged tokens', () => {
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const forgedToken = [
      encode({ alg: 'HS256', typ: 'JWT' }),
      encode({ sub: 'user-x', email: 'attacker@daralhai.com', roles: ['SUPER_ADMIN'], permissions: ['SYSTEM_CONFIGURE'] }),
      'sig',
    ].join('.');

    it('rejects an unsigned token that claims an enterprise email', async () => {
      const app = createApp();
      const response = await request(app)
        .get('/api/internal-test-route')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(response.status).toBe(401);
    });

    it('accepts a token signed by the server', async () => {
      const { signJwt } = require('../src/middleware/platformAuthMiddleware');
      const app = createApp();
      const token = signJwt({ sub: 'user-1', email: 'staff@daralhai.com', roles: [], permissions: [] });
      const response = await request(app)
        .get('/api/internal-test-route')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('refuses to refresh a session from an email alone', async () => {
      const app = createApp();
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ email: 'admin@daralhai.com' });

      expect(response.status).toBe(401);
      expect(response.body.token).toBeUndefined();
    });

    it('refuses to refresh a forged token', async () => {
      const app = createApp();
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${forgedToken}`)
        .send({ email: 'attacker@daralhai.com' });

      expect(response.status).toBe(401);
      expect(response.body.token).toBeUndefined();
    });
  });

  it('keeps health routes public', async () => {
    const app = createApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('EQP Backend Running');
  });
});
