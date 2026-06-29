import { computeStreak } from '../streak.js';

const STATUS_EMOJI = {
  pass: '🌱',
  skip: '🟡',
  pending: '⚪',
  fail: '🔴',
};

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function buildNotificationMessage(db, asOfDate) {
  const habits = db.prepare('SELECT * FROM habits ORDER BY sort_order').all();

  if (habits.length === 0) {
    return 'No habits configured.';
  }

  const getEntry = db.prepare('SELECT status FROM entries WHERE habit_id = ? AND date = ?');

  const lines = [`Habit Check-In — ${asOfDate}`, ''];

  for (const habit of habits) {
    const entry = getEntry.get(habit.id, asOfDate);
    const status = entry?.status ?? 'pending';
    const streak = computeStreak(db, habit.id, asOfDate);
    const emoji = STATUS_EMOJI[status];
    lines.push(`${emoji} ${habit.name}: ${capitalize(status)} (streak: ${streak})`);
  }

  lines.push('');
  lines.push(process.env.APP_URL ?? 'http://localhost:3000');

  return lines.join('\n');
}

export async function buildGraceWarningMessage(db, asOfDate) {
  const habits = db.prepare('SELECT * FROM habits ORDER BY sort_order').all();

  if (habits.length === 0) {
    return null;
  }

  const getEntry = db.prepare('SELECT status FROM entries WHERE habit_id = ? AND date = ?');

  const pendingHabits = habits.filter(habit => {
    const entry = getEntry.get(habit.id, asOfDate);
    return (entry?.status ?? 'pending') === 'pending';
  });

  if (pendingHabits.length === 0) {
    return null;
  }

  const lines = ['⚠️ Habit Check-In — Yesterday still has pending habits!', ''];

  for (const habit of pendingHabits) {
    lines.push(`⚪ ${habit.name}: Pending`);
  }

  lines.push('');
  lines.push(`Check in before tonight → ${process.env.APP_URL ?? 'http://localhost:3000'}`);

  return lines.join('\n');
}

export async function buildEveningMessage(db, asOfDate) {
  const habits = db.prepare('SELECT * FROM habits ORDER BY sort_order').all();

  if (habits.length === 0) {
    return 'No habits configured.';
  }

  const getEntry = db.prepare('SELECT status FROM entries WHERE habit_id = ? AND date = ?');

  const lines = [`🌙 Evening Check-In — ${asOfDate}`, ''];

  for (const habit of habits) {
    const entry = getEntry.get(habit.id, asOfDate);
    const status = entry?.status ?? 'pending';
    const emoji = STATUS_EMOJI[status];
    if (status === 'pending') {
      lines.push(`${emoji} ${habit.name}: Pending`);
    } else {
      const streak = computeStreak(db, habit.id, asOfDate);
      lines.push(`${emoji} ${habit.name}: ${capitalize(status)} (streak: ${streak})`);
    }
  }

  lines.push('');
  lines.push(process.env.APP_URL ?? 'http://localhost:3000');

  return lines.join('\n');
}

export function sendNotification(message, ntfyUrl) {
  return fetch(ntfyUrl, {
    method: 'POST',
    body: message,
  });
}
