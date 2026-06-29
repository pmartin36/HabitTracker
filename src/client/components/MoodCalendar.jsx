import React from 'react';
import { MONTH_NAMES } from '../utils/date.js';
import { useMonthNav } from '../utils/useMonthNav.js';
import { buildDays } from '../utils/calendar.js';

export default function MoodCalendar({ moods, habitPasses, initialYear, initialMonth }) {
  const { year, month, goToPrev, goToNext } = useMonthNav(initialYear, initialMonth);

  const moodMap = Object.fromEntries(
    (moods || []).filter(m => m.rating != null).map(m => [m.date, m.rating])
  );

  const passMap = (habitPasses || []).reduce((acc, { date, emoji }) => {
    (acc[date] ??= []).push(emoji);
    return acc;
  }, {});

  const days = buildDays([], year, month);

  return (
    <div className="mood-calendar">
      <div className="calendar-header">
        <button onClick={goToPrev}>Previous</button>
        <h2>{MONTH_NAMES[month - 1]} {year}</h2>
        <button onClick={goToNext}>Next</button>
      </div>
      <div className="calendar-grid">
        {days.map(({ dateStr }) => {
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
}
