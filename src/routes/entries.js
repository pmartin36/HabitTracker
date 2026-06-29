import { Router } from 'express';
import { computeStreak } from '../streak.js';
import { toDateString } from '../utils/date.js';

const VALID_STATUSES = new Set(['pass', 'skip', 'fail']);

export default function entriesRouter(db) {
  const router = Router();

  const getHabit        = db.prepare('SELECT id FROM habits WHERE id = ?');
  const upsertEntry     = db.prepare(`
    INSERT INTO entries (habit_id, date, status, explicit, updated_at)
    VALUES (?, ?, ?, 1, datetime('now'))
    ON CONFLICT (habit_id, date) DO UPDATE SET
      status     = excluded.status,
      explicit   = 1,
      updated_at = datetime('now')
  `);
  const getEntry        = db.prepare('SELECT * FROM entries WHERE habit_id = ? AND date = ?');
  const getByMonth      = db.prepare("SELECT * FROM entries WHERE habit_id = ? AND date LIKE ?");
  const getAllByMonth    = db.prepare("SELECT * FROM entries WHERE date LIKE ? ORDER BY date");
  const getAllForHabit   = db.prepare("SELECT * FROM entries WHERE habit_id = ? ORDER BY date");

  router.post('/', (req, res) => {
    const { habit_id, date, status } = req.body ?? {};

    if (!status || !VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'status must be pass, skip, or fail' });
    }
    if (!getHabit.get(habit_id)) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    upsertEntry.run(habit_id, date, status);

    const entry  = getEntry.get(habit_id, date);
    const streak = computeStreak(db, habit_id, new Date());

    res.json({ entry, streak });
  });

  router.delete('/', (req, res) => {
    const { habit_id, date } = req.body ?? {};
    if (!habit_id || !date) return res.status(400).json({ error: 'habit_id and date required' });
    db.prepare('DELETE FROM entries WHERE habit_id = ? AND date = ?').run(habit_id, date);
    res.json({ deleted: true });
  });

  router.get('/', (req, res) => {
    const { month } = req.query;
    res.json(getAllByMonth.all(`${month}-%`));
  });

  router.get('/:habit_id', (req, res) => {
    const { habit_id } = req.params;
    const { month } = req.query;
    if (month) {
      res.json(getByMonth.all(habit_id, `${month}-%`));
    } else {
      res.json(getAllForHabit.all(habit_id));
    }
  });

  return router;
}
