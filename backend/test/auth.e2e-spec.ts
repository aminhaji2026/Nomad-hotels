import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, login } from './utils/e2e-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a customer and returns tokens', async () => {
    const email = `guest_${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'ChangeMe123!',
        firstName: 'E2E',
        lastName: 'Guest',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('logs in seed superadmin and owner', async () => {
    const admin = await login(app, 'superadmin@nomadstay.local');
    const owner = await login(app, 'owner@demo-hotel.local');
    expect(admin).toBeTruthy();
    expect(owner).toBeTruthy();
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@nomadstay.local',
        password: 'wrong-password',
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('returns /auth/me for authenticated user', async () => {
    const token = await login(app, 'superadmin@nomadstay.local');
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('superadmin@nomadstay.local');
  });
});
