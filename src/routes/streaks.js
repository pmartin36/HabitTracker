import { Router } from 'express';
import { computeStreak } from '../streak.js';

export default function streaksRouter(db) {
  const router = Router();
  const getAllHabits = db.prepare('SELECT id FROM habits');

  router.get('/', (req, res) => {
    const habits = getAllHabits.all();
    const now = new Date();
    const result = {};
    for (const habit of habits) {
      result[habit.id] = computeStreak(db, habit.id, now);
    }
    res.json(result);
  });

  return router;
}
