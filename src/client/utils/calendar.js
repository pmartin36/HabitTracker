import { formatDate, daysInMonth } from './date.js';

export function buildDays(entries, year, month) {
  const entryMap = Object.fromEntries(entries.map(e => [e.date, e.status]));
  const total = daysInMonth(year, month);
  const firstDOW = new Date(year, month - 1, 1).getDay();
  const prevMonthNum = month === 1 ? 12 : month - 1;
  const prevMonthYear = month === 1 ? year - 1 : year;
  const prevTotal = daysInMonth(prevMonthYear, prevMonthNum);

  const days = [];
  for (let i = 0; i < firstDOW; i++) {
    const d = prevTotal - firstDOW + 1 + i;
    const dateStr = formatDate(prevMonthYear, prevMonthNum, d);
    days.push({ day: d, dateStr, status: entryMap[dateStr] ?? 'pending', overflow: true });
  }
  for (let d = 1; d <= total; d++) {
    const dateStr = formatDate(year, month, d);
    days.push({ day: d, dateStr, status: entryMap[dateStr] ?? 'pending', overflow: false });
  }
  return days;
}
