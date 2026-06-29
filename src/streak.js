import { addDays, toDateString } from './utils/date.js';

export function computeStreak(db, habit_id, asOfDate) {
  const habit = db.prepare('SELECT created_at FROM habits WHERE id = ?').get(habit_id);
  if (!habit) return 0;

  const createdAt = habit.created_at.slice(0, 10);
  const getEntry = db.prepare('SELECT status FROM entries WHERE habit_id = ? AND date = ?');
  let current = toDateString(asOfDate);
  let streak = 0;

  while (current >= createdAt) {
    const entry = getEntry.get(habit_id, current);
    if (entry?.status === 'pass') {
      streak++;
    } else if (entry?.status === 'fail') {
      break;
    }
    current = addDays(current, -1);
  }

  return streak;
}
