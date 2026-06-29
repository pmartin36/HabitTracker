export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function todayString() {
  const d = new Date();
  return formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function formatDate(year, month, day) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function addDays(dateStr, days) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day + days);
  return formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
