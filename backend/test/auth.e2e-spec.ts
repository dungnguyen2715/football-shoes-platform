import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import { clearE2eDatabase, createE2eApp } from './e2e-app';

describe('Auth token lifecycle (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    app = await createE2eApp();
    server = app.getHttpServer() as Server;
  });

  beforeEach(async () => clearE2eDatabase(app));

  afterAll(async () => {
    if (app) await app.close();
  });

  it('registers, logs in, rotates refresh tokens, and revokes a reused token family', async () => {
    await request(server)
      .post('/api/v1/auth/register')
      .send({
        name: 'E2E Customer',
        email: 'auth-lifecycle@example.com',
        password: 'A-strong-password-123',
      })
      .expect(201);

    const login = await request(server)
      .post('/api/v1/auth/login')
      .send({
        email: 'auth-lifecycle@example.com',
        password: 'A-strong-password-123',
      })
      .expect(201);
    const loginBody = login.body as unknown as {
      data: { accessToken: string };
    };
    const oldAccessToken = loginBody.data.accessToken;
    const oldCookie = refreshCookie(login.headers['set-cookie']);
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${oldAccessToken}`)
      .expect(200);

    const rotation = await request(server)
      .post('/api/v1/auth/refresh')
      .set('Cookie', oldCookie)
      .expect(201);
    const newCookie = refreshCookie(rotation.headers['set-cookie']);
    expect(newCookie).not.toBe(oldCookie);
    const rotationBody = rotation.body as unknown as {
      data: { accessToken: string };
    };
    expect(rotationBody.data.accessToken).toEqual(expect.any(String));

    await request(server)
      .post('/api/v1/auth/refresh')
      .set('Cookie', oldCookie)
      .expect(401);

    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${oldAccessToken}`)
      .expect(401);
  });

  it('limits password reset requests after five attempts in one minute', async () => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const result = await request(server)
        .post('/api/v1/auth/password/forgot')
        .send({ email: 'unknown@example.com' });
      statuses.push(result.status);
    }

    expect(statuses).toEqual([202, 202, 202, 202, 202, 429]);
  });
});

function refreshCookie(setCookie: string[] | undefined): string {
  const cookie = setCookie?.find((value) =>
    value.startsWith('bootyard_refresh='),
  );
  if (!cookie) throw new Error('Refresh cookie was not set');
  return cookie.split(';', 1)[0];
}
