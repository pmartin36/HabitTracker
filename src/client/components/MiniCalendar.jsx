import React from 'react';
import { formatDate, daysInMonth } from '../utils/date.js';

const STATUS_CYCLE = {
  pending: 'pass',
  pass: 'skip',
  skip: 'fail',
  fail: 'pending',
};

export default function MiniCalendar({ habitId, entries, onStatusChange, year, month }) {
  const entryMap = {};
  for (const e of entries) {
    entryMap[e.date] = e.status;
  }

  const totalDays = daysInMonth(year, month);
  const days = [];
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = formatDate(year, month, d);
    const status = entryMap[dateStr] ?? 'pending';
    days.push({ dateStr, status });
  }

  function handleClick(dateStr, status) {
    const next = STATUS_CYCLE[status] ?? 'pass';
    onStatusChange(dateStr, next);
  }

  return (
    <div className="mini-calendar">
      {days.map(({ dateStr, status }) => (
        <div
          key={dateStr}
          data-testid={`day-${dateStr}`}
          className={`day status-${status}`}
          onClick={() => handleClick(dateStr, status)}
        >
          {parseInt(dateStr.split('-')[2], 10)}
        </div>
      ))}
    </div>
  );
}
