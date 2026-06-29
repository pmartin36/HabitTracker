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

  const passMap = (habitPasses || []).reduce((acc, { date, emoji }) => {
    (acc[date] ??= []).push(emoji);
    return acc;
  }, {});

  // 3 months: most recent first, going back 2
  const months = [0, -1, -2].map(offset => offsetMonth(year, month, offset));

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
                  const emojis = passMap[dateStr] || [];
                  return (
                    <div
                      key={dateStr}
                      data-testid={`mood-day-${dateStr}`}
                      className={rating != null ? `mood-${rating}` : 'mood-none'}
                    >
                      {emojis.map((emoji, idx) => (
                        <span key={idx}>{emoji}</span>
                      ))}
                    </div>
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
