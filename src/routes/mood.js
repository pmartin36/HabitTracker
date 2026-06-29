import { Router } from 'express';

export default function moodRouter(db) {
  const router = Router();

  const getMoodsByMonth = db.prepare(
    'SELECT date, rating, locked FROM daily_mood WHERE date LIKE ? ORDER BY date'
  );

  const getMoodByDate = db.prepare(
    'SELECT date, rating, locked FROM daily_mood WHERE date = ?'
  );

  const upsertMood = db.prepare(
    `INSERT INTO daily_mood (date, rating, locked)
     VALUES (?, ?, 0)
     ON CONFLICT(date) DO UPDATE SET rating = excluded.rating, locked = 0`
  );

  router.get('/', (req, res) => {
    const { month } = req.query;
    const rows = getMoodsByMonth.all(`${month}%`);
    res.json(rows.map(r => ({ date: r.date, rating: r.rating, locked: Boolean(r.locked) })));
  });

  router.post('/', (req, res) => {
    const { date, rating } = req.body ?? {};

    // Validate rating is integer 1-5
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }

    // Compute today and yesterday using UTC (toISOString) so tests and
    // implementation agree when running in the same environment.
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    // Check grace window: only today or yesterday are editable
    if (date !== today && date !== yesterday) {
      return res.status(409).json({ error: 'Date is outside the grace window' });
    }

    // Check if the row is locked
    const existing = getMoodByDate.get(date);
    if (existing && existing.locked) {
      return res.status(409).json({ error: 'Mood entry is locked' });
    }

    // Upsert the mood row (always with locked=0)
    upsertMood.run(date, rating);

    return res.json({ date, rating, locked: false });
  });

  return router;
}
