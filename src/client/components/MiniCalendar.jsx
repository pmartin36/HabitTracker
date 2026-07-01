import React, { useState } from 'react';
import { buildDays } from '../utils/calendar.js';
import { nextStatus } from '../utils/status.js';
import { todayString, addDays } from '../utils/date.js';

export default function MiniCalendar({ habitId, entries, onStatusChange, year, month, today: todayProp }) {
  const days = buildDays(entries, year, month);
  const todayStr = todayProp ?? todayString();
  const yesterdayStr = addDays(todayStr, -1);
  const [flashingDate, setFlashingDate] = useState(null);

  function handleCellClick(dateStr, currentStatus) {
    const isEditable = dateStr === todayStr || dateStr === yesterdayStr;
    const isFuture = dateStr > todayStr;
    if (isFuture) return;
    if (!isEditable) {
      setFlashingDate(dateStr);
      setTimeout(() => setFlashingDate(null), 400);
      return;
    }
    onStatusChange(dateStr, nextStatus(currentStatus));
  }

  return (
    <div className="mini-calendar">
      {days.map(({ day, dateStr, status, overflow }) => {
        if (overflow) {
          return (
            <div key={`overflow-${dateStr}`} className={`day status-${status} locked-day`}>
              {day}
            </div>
          );
        }
        const isEditable = dateStr === todayStr || dateStr === yesterdayStr;
        const isFuture = dateStr > todayStr;
        return (
          <div
            key={dateStr}
            data-testid={`day-${dateStr}`}
            className={[
              'day',
              isFuture ? 'future' : `status-${status}`,
              !isEditable && !isFuture ? 'locked-day' : '',
              flashingDate === dateStr ? 'flash-locked' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => handleCellClick(dateStr, status)}
          >
            {day}
          </div>
        );
      })}
    </div>
  );
}
