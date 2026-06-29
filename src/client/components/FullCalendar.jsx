import React, { useState } from 'react';
import { buildDays } from '../utils/calendar.js';
import { nextStatus } from '../utils/status.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function FullCalendar({ habitId, entries, onStatusChange, initialYear, initialMonth }) {
  const [{ year, month }, setYearMonth] = useState({ year: initialYear, month: initialMonth });

  const days = buildDays(entries, year, month);

  function goToPrev() {
    setYearMonth(({ year: y, month: m }) =>
      m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 }
    );
  }

  function goToNext() {
    setYearMonth(({ year: y, month: m }) =>
      m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 }
    );
  }

  return (
    <div className="full-calendar">
      <div className="calendar-header">
        <button onClick={goToPrev}>Previous</button>
        <h2>{MONTH_NAMES[month - 1]} {year}</h2>
        <button onClick={goToNext}>Next</button>
      </div>
      <div className="calendar-grid">
        {days.map(({ day, dateStr, status }) => (
          <div
            key={dateStr}
            data-testid={`day-${dateStr}`}
            className={`day status-${status}`}
            onClick={() => onStatusChange(dateStr, nextStatus(status))}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}
