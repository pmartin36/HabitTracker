import { createApp } from './app.js';
import './cron.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const indexHtml = path.join(distDir, 'index.html');

const app = createApp();

// Serve static assets from the Vite build output
app.use(express.static(distDir));

// SPA fallback: any GET not matched by the API or static middleware serves
// the React shell. Gracefully handles the case where dist/ hasn't been built.
app.get('*', (_req, res) => {
  try {
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      res.status(404).send('Not found — run npm run build first');
    }
  } catch (err) {
    res.status(404).send('Not found');
  }
});

export function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Habit Tracker listening on port ${server.address().port}`);
  });
  return server;
}

// Only start automatically when this file is the entry point
if (process.argv[1] === __filename) {
  startServer(process.env.PORT ?? 3000);
}
