import crypto from 'crypto';
import express from 'express';

const COOKIE_NAME = 'ht_auth';
const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;

function computeToken(password) {
  return crypto.createHmac('sha256', password).update('authenticated').digest('hex');
}

function parseCookieHeader(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    cookies[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return cookies;
}

function isValidToken(token, expected) {
  if (!token || token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

function loginPageHtml(error) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Habit Tracker — Log in</title>
<style>
  body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #111; color: #eee; }
  form { display: flex; flex-direction: column; gap: 12px; width: 260px; }
  input { padding: 10px; font-size: 16px; border-radius: 8px; border: 1px solid #444; background: #222; color: #eee; }
  button { padding: 10px; font-size: 16px; border-radius: 8px; border: none; background: #4f8; color: #111; font-weight: 600; cursor: pointer; }
  p.error { color: #f66; margin: 0; }
</style>
</head>
<body>
  <form method="POST" action="/api/login">
    <h2>🔥 Habit Tracker</h2>
    ${error ? '<p class="error">Wrong password.</p>' : ''}
    <input type="password" name="password" placeholder="Password" autofocus required />
    <button type="submit">Log in</button>
  </form>
</body>
</html>`;
}

/**
 * Gates every request behind a single shared password. On success, sets a
 * long-lived cookie so the browser never has to log in again. The cookie is
 * an HMAC of a fixed message keyed by AUTH_PASSWORD, so it verifies without
 * server-side session storage and is invalidated by rotating the password.
 *
 * A no-op when AUTH_PASSWORD is unset, so deployments that rely on network
 * isolation (e.g. Tailscale) instead of app-level auth are unaffected.
 */
export function authGate() {
  const password = process.env.AUTH_PASSWORD;
  const router = express.Router();

  if (!password) {
    return router;
  }

  const cookieSecure = process.env.COOKIE_SECURE !== 'false';
  const expectedToken = computeToken(password);

  router.get('/login', (_req, res) => {
    res.type('html').send(loginPageHtml(false));
  });

  router.post('/api/login', express.urlencoded({ extended: false }), (req, res) => {
    if (req.body?.password !== password) {
      return res.status(401).type('html').send(loginPageHtml(true));
    }
    res.cookie(COOKIE_NAME, expectedToken, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'lax',
      maxAge: TEN_YEARS_MS,
      path: '/',
    });
    res.redirect('/');
  });

  router.use((req, res, next) => {
    if (req.path === '/health') {
      return next();
    }
    const cookies = parseCookieHeader(req.headers.cookie);
    if (isValidToken(cookies[COOKIE_NAME], expectedToken)) {
      return next();
    }
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.redirect('/login');
  });

  return router;
}
