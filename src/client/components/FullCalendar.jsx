import React from 'react';
import { buildDays } from '../utils/calendar.js';
import { nextStatus } from '../utils/status.js';
import { MONTH_NAMES } from '../utils/date.js';
import { useMonthNav } from '../utils/useMonthNav.js';

export default function FullCalendar({ habitId, entries, onStatusChange, initialYear, initialMonth }) {
  const { year, month, goToPrev, goToNext } = useMonthNav(initialYear, initialMonth);
  const days = buildDays(entries, year, month);

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
