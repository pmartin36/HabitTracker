import express from 'express';
import db from './db/index.js';
import habitsRouter from './routes/habits.js';
import entriesRouter from './routes/entries.js';
import moodRouter from './routes/mood.js';

/**
 * Creates an Express app, optionally injecting a database instance.
 * Passing a db is used by tests to mount against an isolated in-memory db.
 *
 * @param {import('better-sqlite3').Database} [injectedDb]
 * @returns {import('express').Express}
 */
export function createApp(injectedDb) {
  const database = injectedDb ?? db;
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/habits', habitsRouter(database));
  app.use('/api/entries', entriesRouter(database));
  app.use('/api/mood', moodRouter(database));

  return app;
}

const app = createApp();

export function startServer(port) {
  return app.listen(port);
}

export default app;
