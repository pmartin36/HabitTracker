import React, { useState } from 'react';
import { formatDate, daysInMonth } from '../utils/date.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function MoodCalendar({ moods, habitPasses, initialYear, initialMonth }) {
  const [{ year, month }, setYearMonth] = useState({ year: initialYear, month: initialMonth });

  // Build a rating lookup: date -> rating
  const moodMap = Object.fromEntries(
    (moods || []).filter(m => m.rating != null).map(m => [m.date, m.rating])
  );

  // Build a pass lookup: date -> [emoji, ...]
  const passMap = {};
  for (const { date, emoji } of (habitPasses || [])) {
    if (!passMap[date]) passMap[date] = [];
    passMap[date].push(emoji);
  }

  // Generate all days for the current month
  const total = daysInMonth(year, month);
  const days = [];
  for (let d = 1; d <= total; d++) {
    days.push(formatDate(year, month, d));
  }

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
    <div className="mood-calendar">
      <div className="calendar-header">
        <button onClick={goToPrev}>Previous</button>
        <h2>{MONTH_NAMES[month - 1]} {year}</h2>
        <button onClick={goToNext}>Next</button>
      </div>
      <div className="calendar-grid">
        {days.map(dateStr => {
          const rating = moodMap[dateStr];
          const moodClass = rating != null ? `mood-${rating}` : 'mood-none';
          const emojis = passMap[dateStr] || [];
          return (
            <div
              key={dateStr}
              data-testid={`mood-day-${dateStr}`}
              className={moodClass}
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
}
