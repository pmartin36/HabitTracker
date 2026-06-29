import React from 'react';
import { nextStatus } from '../utils/status.js';
import { MONTH_NAMES, formatDate, daysInMonth } from '../utils/date.js';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function generateMonths(initialYear) {
  const months = [];
  for (let m = 1; m <= 12; m++) {
    months.push({ year: initialYear, month: m });
  }
  return months; // Jan first, Dec last
}

export default function FullCalendar({ entries, onStatusChange, initialYear, initialMonth, createdAt }) {
  const months = generateMonths(initialYear);
  const entryMap = Object.fromEntries(entries.map(e => [e.date, e.status]));

  const now = new Date();
  const todayStr = formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());

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
              {cells.map(cell => {
                if (cell.blank) {
                  return <div key={cell.key} />;
                }
                const isFuture = cell.dateStr > todayStr;
                return (
                  <div
                    key={cell.key}
                    data-testid={`day-${cell.dateStr}`}
                    className={isFuture ? 'day future' : `day status-${cell.status}`}
                    onClick={isFuture ? undefined : () => onStatusChange(cell.dateStr, nextStatus(cell.status))}
                    style={isFuture ? { pointerEvents: 'none' } : undefined}
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
