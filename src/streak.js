import { addDays, toDateString } from './utils/date.js';

export function computeStreak(db, habit_id, asOfDate) {
  const habit = db.prepare('SELECT created_at FROM habits WHERE id = ?').get(habit_id);
  if (!habit) return 0;

  // Walk back to the earliest entry date so retroactively-marked entries
  // (e.g. yesterday marked via the mini-calendar on a habit created today)
  // are included in the streak.  If no entries exist yet, fall back to the
  // habit creation date to avoid an unbounded walk.
  const earliest = db.prepare(
    'SELECT MIN(date) AS d FROM entries WHERE habit_id = ?'
  ).get(habit_id);
  const boundary = earliest?.d ?? habit.created_at.slice(0, 10);

  const getEntry = db.prepare('SELECT status FROM entries WHERE habit_id = ? AND date = ?');
  let current = toDateString(asOfDate);
  let streak = 0;

  while (current >= boundary) {
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
