const request = require('supertest');
const { createApp } = require('../src/app');

describe('health route', () => {
  it('returns backend health message', async () => {
    const app = createApp();
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('EQP Backend Running');
  });
});
