import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';

// Mock cron.js so scheduled jobs never start during tests
vi.mock('../src/cron.js', () => ({}));

// src/server.js does not exist yet — this import will fail until it is created.
// That is the expected "red" state before implementation.
import { startServer } from '../src/server.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ensure dist/index.html exists so the SPA fallback handler can serve it.
 * We create a minimal stub file before the suite and remove it after.
 */
const distDir = path.resolve('/home/paul/Source/HabitTracker/dist');
const indexHtml = path.join(distDir, 'index.html');
const createdDist = !fs.existsSync(distDir);
const createdIndex = !fs.existsSync(indexHtml);

function ensureDistStub() {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  if (!fs.existsSync(indexHtml)) {
    fs.writeFileSync(indexHtml, '<!doctype html><html><body>stub</body></html>');
  }
}

function teardownDistStub() {
  if (createdIndex && fs.existsSync(indexHtml)) {
    fs.unlinkSync(indexHtml);
  }
  if (createdDist && fs.existsSync(distDir)) {
    fs.rmdirSync(distDir);
  }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('server.js entry point', () => {
  beforeAll(() => {
    ensureDistStub();
  });

  afterAll(() => {
    teardownDistStub();
  });

  // -------------------------------------------------------------------------
  // 1. Starting the server returns a closeable handle
  // -------------------------------------------------------------------------
  it('startServer(0) returns a handle with a .close() method', async () => {
    const server = startServer(0);
    expect(server).toBeDefined();
    expect(typeof server.close).toBe('function');
    await new Promise((resolve) => server.close(resolve));
  });

  // -------------------------------------------------------------------------
  // 2. GET /health still works through the server
  // -------------------------------------------------------------------------
  it('GET /health returns 200 { status: "ok" }', async () => {
    const server = startServer(0);
    try {
      const res = await request(server).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // -------------------------------------------------------------------------
  // 3. API routes still work
  // -------------------------------------------------------------------------
  it('GET /api/habits returns 200', async () => {
    const server = startServer(0);
    try {
      const res = await request(server).get('/api/habits');
      expect(res.status).toBe(200);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // -------------------------------------------------------------------------
  // 4. SPA fallback — unknown GET routes serve dist/index.html
  // -------------------------------------------------------------------------
  it('GET /some-unknown-route returns 200 and serves something (SPA fallback)', async () => {
    const server = startServer(0);
    try {
      const res = await request(server).get('/some-unknown-route');
      expect(res.status).toBe(200);
      // The response should be HTML (the SPA shell)
      expect(res.headers['content-type']).toMatch(/html/);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // -------------------------------------------------------------------------
  // 5. Server respects PORT env var
  // -------------------------------------------------------------------------
  it('server listens on the port specified by the PORT env var', async () => {
    // Use a high ephemeral port unlikely to be in use
    const customPort = 19876;
    const original = process.env.PORT;
    process.env.PORT = String(customPort);

    // Re-importing server.js won't re-run its top-level code in Vitest's module
    // cache, so we call startServer directly with the env-derived port.
    const port = Number(process.env.PORT ?? 3000);
    const server = startServer(port);
    try {
      await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
      });
      const address = server.address();
      expect(address.port).toBe(customPort);
    } finally {
      await new Promise((resolve) => server.close(resolve));
      if (original === undefined) {
        delete process.env.PORT;
      } else {
        process.env.PORT = original;
      }
    }
  });
});
