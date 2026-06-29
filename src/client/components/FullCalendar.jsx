import React, { useState } from 'react';
import { formatDate, daysInMonth } from '../utils/date.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_CYCLE = {
  pending: 'pass',
  pass: 'skip',
  skip: 'fail',
  fail: 'pending',
};

export default function FullCalendar({ habitId, entries, onStatusChange, initialYear, initialMonth }) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

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

  function goToPrev() {
    if (month === 1) {
      setYear(y => y - 1);
      setMonth(12);
    } else {
      setMonth(m => m - 1);
    }
  }

  function goToNext() {
    if (month === 12) {
      setYear(y => y + 1);
      setMonth(1);
    } else {
      setMonth(m => m + 1);
    }
  }

  return (
    <div className="full-calendar">
      <div className="calendar-header">
        <button onClick={goToPrev}>Previous</button>
        <h2>{MONTH_NAMES[month - 1]} {year}</h2>
        <button onClick={goToNext}>Next</button>
      </div>
      <div className="calendar-grid">
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
    </div>
  );
}
