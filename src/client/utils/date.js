export function todayString() {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(year, month, day) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}
