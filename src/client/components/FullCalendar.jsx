import React from 'react';
import { nextStatus } from '../utils/status.js';
import { MONTH_NAMES, formatDate, daysInMonth } from '../utils/date.js';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function generateMonths(createdAt, initialYear, initialMonth) {
  // Always go back at least 12 months
  const twelveMonthsAgo = new Date(initialYear, initialMonth - 1 - 11, 1);
  const createdDate = createdAt ? new Date(createdAt) : twelveMonthsAgo;
  const startDate = createdDate < twelveMonthsAgo ? createdDate : twelveMonthsAgo;

  const months = [];
  let y = initialYear;
  let m = initialMonth;

  while (
    y > startDate.getFullYear() ||
    (y === startDate.getFullYear() && m >= startDate.getMonth() + 1)
  ) {
    months.push({ year: y, month: m });
    m--;
    if (m === 0) { m = 12; y--; }
  }
  return months; // already newest-first; rendered top-to-bottom
}

export default function FullCalendar({ entries, onStatusChange, initialYear, initialMonth, createdAt }) {
  const months = generateMonths(createdAt, initialYear, initialMonth);
  const entryMap = Object.fromEntries(entries.map(e => [e.date, e.status]));

  return (
    <div className="full-calendar">
      {months.map(({ year, month }) => {
        const total = daysInMonth(year, month);
        const firstDOW = new Date(year, month - 1, 1).getDay(); // 0 = Sunday

        const cells = [];
        for (let i = 0; i < firstDOW; i++) {
          cells.push({ key: `blank-${year}-${month}-${i}`, blank: true });
        }
        for (let d = 1; d <= total; d++) {
          const dateStr = formatDate(year, month, d);
          cells.push({
            key: dateStr,
            blank: false,
            day: d,
            dateStr,
            status: entryMap[dateStr] ?? 'pending',
          });
        }

        return (
          <div key={`${year}-${month}`} className="full-calendar-month">
            <div className="full-calendar-month-heading">
              {MONTH_NAMES[month - 1]} {year}
            </div>
            <div className="full-calendar-dow">
              {DOW_LABELS.map(d => <span key={d}>{d}</span>)}
            </div>
            <div className="full-calendar-grid">
              {cells.map(cell =>
                cell.blank ? (
                  <div key={cell.key} />
                ) : (
                  <div
                    key={cell.key}
                    data-testid={`day-${cell.dateStr}`}
                    className={`day status-${cell.status}`}
                    onClick={() => onStatusChange(cell.dateStr, nextStatus(cell.status))}
                  >
                    {cell.day}
                  </div>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
