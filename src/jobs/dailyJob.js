/**
 * Subtracts `days` days from a 'YYYY-MM-DD' string and returns the result
 * as a 'YYYY-MM-DD' string.
 */
function subtractDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * Runs the nightly maintenance job:
 *   1. Flips any pending (explicit=false) entries older than 2 days to 'fail'.
 *   2. Locks any daily_mood rows older than 2 days that are still unlocked.
 *
 * Never creates new rows — only updates existing ones.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} asOfDate  'YYYY-MM-DD'
 * @returns {{ lockedEntries: number, lockedMoods: number }}
 */
export function runDailyJob(db, asOfDate) {
  const cutoff = subtractDays(asOfDate, 2);

  const { changes: lockedEntries } = db
    .prepare(`
      UPDATE entries
      SET status = 'fail'
      WHERE status = 'pending'
        AND explicit = 0
        AND date <= ?
    `)
    .run(cutoff);

  const { changes: lockedMoods } = db
    .prepare(`
      UPDATE daily_mood
      SET locked = 1
      WHERE locked = 0
        AND date <= ?
    `)
    .run(cutoff);

  return { lockedEntries, lockedMoods };
}
