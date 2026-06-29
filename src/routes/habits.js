import { Router } from 'express';

/**
 * Factory function — accepts a db instance and returns an Express router.
 * This allows tests to inject an isolated in-memory database.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {import('express').Router}
 */
export default function habitsRouter(db) {
  const router = Router();

  // GET / — all habits ordered by sort_order ascending
  router.get('/', (req, res) => {
    const habits = db
      .prepare('SELECT * FROM habits ORDER BY sort_order ASC')
      .all();
    res.json(habits);
  });

  // POST / — create a new habit
  router.post('/', (req, res) => {
    const { name, emoji } = req.body ?? {};

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'name is required' });
    }

    const { cnt } = db
      .prepare('SELECT COUNT(*) AS cnt FROM habits')
      .get();
    if (cnt >= 5) {
      return res.status(409).json({ error: 'Maximum of 5 habits allowed' });
    }

    const { maxOrder } = db
      .prepare('SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM habits')
      .get();

    const info = db
      .prepare(
        'INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)'
      )
      .run(name, emoji ?? null, maxOrder + 1);

    const habit = db
      .prepare('SELECT * FROM habits WHERE id = ?')
      .get(info.lastInsertRowid);
    res.status(201).json(habit);
  });

  // PATCH /reorder — atomically update sort_orders for multiple habits
  // NOTE: this route must be defined BEFORE PATCH /:id so Express does not
  // treat the literal string "reorder" as an :id parameter.
  router.patch('/reorder', (req, res) => {
    const updates = req.body; // [{id, sort_order}, ...]
    const stmt = db.prepare('UPDATE habits SET sort_order = ? WHERE id = ?');
    db.transaction((items) => {
      for (const item of items) {
        stmt.run(item.sort_order, item.id);
      }
    })(updates);
    res.json({ ok: true });
  });

  // PATCH /:id — update name and/or emoji
  router.patch('/:id', (req, res) => {
    const id = Number(req.params.id);
    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
    if (!habit) {
      return res.status(404).json({ error: 'Not found' });
    }

    const { name, emoji } = req.body ?? {};
    const newName = name !== undefined ? name : habit.name;
    const newEmoji = emoji !== undefined ? emoji : habit.emoji;

    db.prepare('UPDATE habits SET name = ?, emoji = ? WHERE id = ?').run(
      newName,
      newEmoji,
      id
    );

    const updated = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
    res.json(updated);
  });

  // DELETE /:id — delete a habit
  router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    const { changes } = db
      .prepare('DELETE FROM habits WHERE id = ?')
      .run(id);
    if (changes === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(204).end();
  });

  return router;
}
