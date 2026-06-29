import { Router } from 'express';
import { computeStreak } from '../streak.js';
import { localToday } from '../utils/date.js';

export default function streaksRouter(db) {
  const router = Router();
  const getAllHabits = db.prepare('SELECT id FROM habits');

  router.get('/', (req, res) => {
    const habits = getAllHabits.all();
    const today = localToday();
    const result = {};
    for (const habit of habits) {
      result[habit.id] = computeStreak(db, habit.id, today);
    }
    res.json(result);
  });

  return router;
}
