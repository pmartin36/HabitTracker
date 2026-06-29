import React from 'react';
import { buildDays } from '../utils/calendar.js';
import { nextStatus } from '../utils/status.js';

export default function MiniCalendar({ habitId, entries, onStatusChange, year, month }) {
  const days = buildDays(entries, year, month);

  return (
    <div className="mini-calendar">
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
  );
}
