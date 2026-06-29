import React, { useState } from 'react';
import { MONTH_NAMES, daysInMonth, formatDate } from '../utils/date.js';

function offsetMonth(year, month, delta) {
  const d = new Date(year, month - 1 + delta);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function buildMoodDays(year, month) {
  const total = daysInMonth(year, month);
  const days = [];
  for (let d = 1; d <= total; d++) {
    days.push(formatDate(year, month, d));
  }
  return days;
}

function MoodDayCell({ day, entry, passes, ...rest }) {
  const topRow = passes.slice(0, 3);
  const bottomRow = passes.slice(3, 5);
  return (
    <div className={`mood-day mood-${entry?.rating ?? 'none'}`} {...rest}>
      <div className="mood-day-emojis">
        {topRow.length > 0 && (
          <div className="mood-emoji-row">{topRow.map((p, i) => <span key={i}>{p.emoji}</span>)}</div>
        )}
        {bottomRow.length > 0 && (
          <div className="mood-emoji-row">{bottomRow.map((p, i) => <span key={i}>{p.emoji}</span>)}</div>
        )}
      </div>
      <span className="mood-day-num">{day}</span>
    </div>
  );
}

export default function MoodCalendar({ moods, habitPasses, initialYear, initialMonth }) {
  const [{ year, month }, setYearMonth] = useState({ year: initialYear, month: initialMonth });

  function navigate(delta) {
    setYearMonth(({ year: y, month: m }) => {
      const d = new Date(y, m - 1 + delta);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  }

  const moodMap = Object.fromEntries(
    (moods || []).filter(m => m.rating != null).map(m => [m.date, m.rating])
  );

  // 3 months: oldest on left, most recent on right
  const months = [-2, -1, 0].map(offset => offsetMonth(year, month, offset));

  return (
    <div className="mood-calendar">
      <div className="calendar-header">
        <button onClick={() => navigate(-3)}>Previous</button>
        <button onClick={() => navigate(3)}>Next</button>
      </div>
      <div className="mood-calendar-months">
        {months.map(({ year: y, month: m }) => {
          const days = buildMoodDays(y, m);
          return (
            <div key={`${y}-${m}`} className="mood-calendar-month">
              <div className="mood-calendar-month-heading">
                {MONTH_NAMES[m - 1]} {y}
              </div>
              <div className="calendar-grid">
                {days.map(dateStr => {
                  const rating = moodMap[dateStr];
                  const entry = rating != null ? { rating } : undefined;
                  const passes = (habitPasses || []).filter(p => p.date === dateStr);
                  const day = parseInt(dateStr.split('-')[2], 10);
                  return (
                    <MoodDayCell
                      key={dateStr}
                      day={day}
                      entry={entry}
                      passes={passes}
                      data-testid={`mood-day-${dateStr}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
