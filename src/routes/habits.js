import { Router } from 'express';
import { localToday } from '../utils/date.js';

export default function habitsRouter(db) {
  const router = Router();

  const getAll       = db.prepare('SELECT * FROM habits WHERE archived_at IS NULL ORDER BY sort_order ASC');
  const getArchived  = db.prepare('SELECT * FROM habits WHERE archived_at IS NOT NULL ORDER BY archived_at DESC');
  const getStats     = db.prepare('SELECT COUNT(*) AS cnt, COALESCE(MAX(sort_order), 0) AS maxOrder FROM habits WHERE archived_at IS NULL');
  const insertHabit  = db.prepare('INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)');
  const getById      = db.prepare('SELECT * FROM habits WHERE id = ?');
  const reorderStmt  = db.prepare('UPDATE habits SET sort_order = ? WHERE id = ?');
  const updateHabit  = db.prepare('UPDATE habits SET name = ?, emoji = ? WHERE id = ?');
  const archiveHabit = db.prepare("UPDATE habits SET archived_at = datetime('now') WHERE id = ? AND archived_at IS NULL");
  const reinstateHabit = db.prepare('UPDATE habits SET archived_at = NULL, streak_from = ?, sort_order = ? WHERE id = ?');

  router.get('/', (_req, res) => {
    res.json(getAll.all());
  });

  router.get('/archived', (_req, res) => {
    res.json(getArchived.all());
  });

  router.post('/', (req, res) => {
    const { name, emoji } = req.body ?? {};
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'name is required' });
    }
    const { cnt, maxOrder } = getStats.get();
    if (cnt >= 5) {
      return res.status(409).json({ error: 'Maximum of 5 habits allowed' });
    }
    const info = insertHabit.run(name, emoji ?? null, maxOrder + 1);
    res.status(201).json(getById.get(info.lastInsertRowid));
  });

  // Must be declared before PATCH /:id — 'reorder' would otherwise match :id
  router.patch('/reorder', (req, res) => {
    db.transaction((items) => {
      for (const item of items) reorderStmt.run(item.sort_order, item.id);
    })(req.body);
    res.json({ ok: true });
  });

  router.patch('/:id', (req, res) => {
    const id = Number(req.params.id);
    const habit = getById.get(id);
    if (!habit) return res.status(404).json({ error: 'Not found' });
    const { name = habit.name, emoji = habit.emoji } = req.body ?? {};
    updateHabit.run(name, emoji, id);
    res.json({ ...habit, name, emoji });
  });

  router.post('/:id/reinstate', (req, res) => {
    const id = Number(req.params.id);
    const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND archived_at IS NOT NULL').get(id);
    if (!habit) return res.status(404).json({ error: 'Not found or not archived' });
    const { cnt, maxOrder } = getStats.get();
    if (cnt >= 5) return res.status(409).json({ error: 'Maximum of 5 habits allowed' });
    reinstateHabit.run(localToday(), maxOrder + 1, id);
    res.json(getById.get(id));
  });

  router.delete('/:id', (req, res) => {
    const { changes } = archiveHabit.run(Number(req.params.id));
    if (changes === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  });

  return router;
}
