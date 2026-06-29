import { Router } from 'express';
import { computeStreak } from '../streak.js';

const VALID_STATUSES = new Set(['pass', 'skip', 'fail']);

/**
 * Factory function — accepts a db instance and returns an Express router.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {import('express').Router}
 */
export default function entriesRouter(db) {
  const router = Router();

  // POST / — upsert an entry; returns { entry, streak }
  router.post('/', (req, res) => {
    const { habit_id, date, status } = req.body ?? {};

    // 'pending' is a system-only status; unrecognised values are also rejected
    if (!status || !VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'status must be pass, skip, or fail' });
    }

    // Verify the habit exists
    const habit = db
      .prepare('SELECT id FROM habits WHERE id = ?')
      .get(habit_id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Upsert — preserve the row id on conflict
    db.prepare(`
      INSERT INTO entries (habit_id, date, status, explicit, updated_at)
      VALUES (?, ?, ?, 1, datetime('now'))
      ON CONFLICT (habit_id, date) DO UPDATE SET
        status     = excluded.status,
        explicit   = 1,
        updated_at = datetime('now')
    `).run(habit_id, date, status);

    const entry = db
      .prepare('SELECT * FROM entries WHERE habit_id = ? AND date = ?')
      .get(habit_id, date);

    const streak = computeStreak(db, habit_id, date);

    res.json({ entry, streak });
  });

  // GET /:habit_id?month=YYYY-MM — entries for a habit in a given month
  router.get('/:habit_id', (req, res) => {
    const { habit_id } = req.params;
    const { month } = req.query;

    const entries = db
      .prepare(
        "SELECT * FROM entries WHERE habit_id = ? AND date LIKE ?"
      )
      .all(habit_id, `${month}-%`);

    res.json(entries);
  });

  return router;
}
