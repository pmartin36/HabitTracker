import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { runMigrations } from '../src/db/migrations.js';
import { createApp } from '../src/app.js';

function makeApp() {
  const db = new Database(':memory:');
  runMigrations(db);
  return createApp(db);
}

describe('authGate', () => {
  const original = { AUTH_PASSWORD: process.env.AUTH_PASSWORD, COOKIE_SECURE: process.env.COOKIE_SECURE };

  afterEach(() => {
    if (original.AUTH_PASSWORD === undefined) delete process.env.AUTH_PASSWORD;
    else process.env.AUTH_PASSWORD = original.AUTH_PASSWORD;
    if (original.COOKIE_SECURE === undefined) delete process.env.COOKIE_SECURE;
    else process.env.COOKIE_SECURE = original.COOKIE_SECURE;
  });

  it('is a no-op when AUTH_PASSWORD is unset', async () => {
    delete process.env.AUTH_PASSWORD;
    const app = makeApp();
    const res = await request(app).get('/api/habits');
    expect(res.status).toBe(200);
  });

  it('blocks API requests without a valid cookie when AUTH_PASSWORD is set', async () => {
    process.env.AUTH_PASSWORD = 'sekrit';
    const app = makeApp();
    const res = await request(app).get('/api/habits');
    expect(res.status).toBe(401);
  });

  it('redirects unauthenticated HTML requests to /login', async () => {
    process.env.AUTH_PASSWORD = 'sekrit';
    const app = makeApp();
    const res = await request(app).get('/');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  it('allows /health without auth', async () => {
    process.env.AUTH_PASSWORD = 'sekrit';
    const app = makeApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('rejects the wrong password', async () => {
    process.env.AUTH_PASSWORD = 'sekrit';
    const app = makeApp();
    const res = await request(app).post('/api/login').type('form').send({ password: 'nope' });
    expect(res.status).toBe(401);
  });

  it('sets a long-lived cookie on correct password and grants access with it', async () => {
    process.env.AUTH_PASSWORD = 'sekrit';
    const app = makeApp();

    const loginRes = await request(app).post('/api/login').type('form').send({ password: 'sekrit' });
    expect(loginRes.status).toBe(302);
    const setCookie = loginRes.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookie = setCookie[0];
    expect(cookie).toMatch(/ht_auth=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Max-Age=315360000/);

    const authed = await request(app).get('/api/habits').set('Cookie', cookie);
    expect(authed.status).toBe(200);
  });

  it('omits Secure attribute when COOKIE_SECURE=false', async () => {
    process.env.AUTH_PASSWORD = 'sekrit';
    process.env.COOKIE_SECURE = 'false';
    const app = makeApp();
    const loginRes = await request(app).post('/api/login').type('form').send({ password: 'sekrit' });
    const cookie = loginRes.headers['set-cookie'][0];
    expect(cookie).not.toMatch(/Secure/);
  });
});
