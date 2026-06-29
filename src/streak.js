/**
 * Converts a Date object or 'YYYY-MM-DD' string to a 'YYYY-MM-DD' string.
 */
function toDateString(d) {
  if (d instanceof Date) {
    return d.toISOString().slice(0, 10);
  }
  return d;
}

/**
 * Returns the date string for the day before the given 'YYYY-MM-DD' string.
 */
function prevDay(dateStr) {
  const [y, m, day] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, day);
  date.setDate(date.getDate() - 1);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * Computes the streak for a habit as of a given date.
 *
 * Walks backward from asOfDate to habit.created_at:
 *   - pass:            streak++
 *   - fail:            break
 *   - skip / no row:   continue (transparent)
 *
 * @param {import('better-sqlite3').Database} db
 * @param {number} habit_id
 * @param {Date|string} asOfDate  Date object or 'YYYY-MM-DD' string
 * @returns {number}
 */
export function computeStreak(db, habit_id, asOfDate) {
  const habit = db.prepare('SELECT created_at FROM habits WHERE id = ?').get(habit_id);
  if (!habit) return 0;

  const createdAt = habit.created_at.slice(0, 10);
  let current = toDateString(asOfDate);
  let streak = 0;

  const getEntry = db.prepare(
    'SELECT status FROM entries WHERE habit_id = ? AND date = ?'
  );

  while (current >= createdAt) {
    const entry = getEntry.get(habit_id, current);

    if (!entry || entry.status === 'skip' || entry.status === 'pending') {
      // transparent — does not increment or break
    } else if (entry.status === 'pass') {
      streak++;
    } else if (entry.status === 'fail') {
      break;
    }

    current = prevDay(current);
  }

  return streak;
}
