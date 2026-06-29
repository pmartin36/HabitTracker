import { addDays } from '../utils/date.js';

export function runDailyJob(db, asOfDate) {
  const cutoff = addDays(asOfDate, -2);

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
