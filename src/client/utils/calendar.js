import { formatDate, daysInMonth } from './date.js';

export function buildDays(entries, year, month) {
  const entryMap = Object.fromEntries(entries.map(e => [e.date, e.status]));
  const total = daysInMonth(year, month);
  const days = [];
  for (let d = 1; d <= total; d++) {
    const dateStr = formatDate(year, month, d);
    days.push({ day: d, dateStr, status: entryMap[dateStr] ?? 'pending' });
  }
  return days;
}
