import React, { useState } from 'react';
import { MONTH_NAMES, daysInMonth, formatDate } from '../utils/date.js';

const MOOD_LABELS = ['', 'Very Good', 'Good', 'Neutral', 'Not Great', 'Bad'];
const MOOD_ICONS  = ['', '😄', '🙂', '😐', '🙁', '😣'];

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

function MoodDayCell({ day, dateStr, entry, passes, ...rest }) {
  const [hovered, setHovered] = useState(false);
  const topRow = passes.slice(0, 3);
  const bottomRow = passes.slice(3, 5);
  const hasTooltip = entry || passes.length > 0;
  return (
    <div
      className={`mood-day mood-${entry?.rating ?? 'none'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...rest}
    >
      <div className="mood-day-emojis">
        {topRow.length > 0 && (
          <div className="mood-emoji-row">{topRow.map((p, i) => <span key={i}>{p.emoji}</span>)}</div>
        )}
        {bottomRow.length > 0 && (
          <div className="mood-emoji-row">{bottomRow.map((p, i) => <span key={i}>{p.emoji}</span>)}</div>
        )}
      </div>
      <span className="mood-day-num">{day}</span>
      {hovered && hasTooltip && (
        <div className="mood-day-tooltip">
          {entry && (
            <div className="tooltip-mood">{MOOD_ICONS[entry.rating]} {MOOD_LABELS[entry.rating]}</div>
          )}
          {passes.map((p, i) => (
            <div key={i} className="tooltip-pass">{p.emoji} {p.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MoodCalendar({ moods, habitPasses, habits, initialYear, initialMonth }) {
  const [{ year, month }, setYearMonth] = useState({ year: initialYear, month: initialMonth });
  const [view, setView] = useState('3month');
  const [yearViewYear, setYearViewYear] = useState(initialYear);
  const [showLegend, setShowLegend] = useState(false);

  function navigate(delta) {
    if (view === 'year') {
      setYearViewYear(y => y + delta);
    } else {
      setYearMonth(({ year: y, month: m }) => {
        const d = new Date(y, m - 1 + delta * 3);
        return { year: d.getFullYear(), month: d.getMonth() + 1 };
      });
    }
  }

  const moodMap = Object.fromEntries(
    (moods || []).filter(m => m.rating != null).map(m => [m.date, m.rating])
  );

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;

  function renderMonth(y, m, applyFutureFilter) {
    const isFuture = applyFutureFilter &&
      (y > currentYear || (y === currentYear && m > currentMonthNum));
    const days = buildMoodDays(y, m);
    return (
      <div key={`${y}-${m}`} className="mood-calendar-month">
        <div className="mood-calendar-month-heading">
          {MONTH_NAMES[m - 1]} {y}
        </div>
        <div className="calendar-grid">
          {days.map(dateStr => {
            const day = parseInt(dateStr.split('-')[2], 10);
            if (isFuture) {
              return (
                <div
                  key={dateStr}
                  className="mood-day mood-none mood-day-future"
                  data-testid={`mood-day-${dateStr}`}
                >
                  <span className="mood-day-num">{day}</span>
                </div>
              );
            }
            const rating = moodMap[dateStr];
            const entry = rating != null ? { rating } : undefined;
            const passes = (habitPasses || []).filter(p => p.date === dateStr);
            return (
              <MoodDayCell
                key={dateStr}
                day={day}
                dateStr={dateStr}
                entry={entry}
                passes={passes}
                data-testid={`mood-day-${dateStr}`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // 3 months: oldest on left, most recent on right
  const threeMonths = [-2, -1, 0].map(offset => offsetMonth(year, month, offset));

  // Year view: all 12 months of the selected year
  const yearMonths = Array.from({ length: 12 }, (_, i) => ({
    year: yearViewYear,
    month: i + 1,
  }));

  return (
    <div className="mood-calendar">
      <div className="mood-cal-header">
        <button className="mood-cal-nav" aria-label="Previous" onClick={() => navigate(-1)}>‹</button>
        <span className="mood-cal-title">
          {view === 'year'
            ? yearViewYear
            : `${MONTH_NAMES[threeMonths[0].month - 1].slice(0, 3)} – ${MONTH_NAMES[threeMonths[2].month - 1].slice(0, 3)} ${threeMonths[2].year}`}
        </span>
        <button className="mood-cal-nav" aria-label="Next" onClick={() => navigate(1)}>›</button>
        <div className="mood-view-toggle">
          <button className={view === '3month' ? 'active' : ''} onClick={() => setView('3month')}>3M</button>
          <button className={view === 'year' ? 'active' : ''} onClick={() => setView('year')}>Year</button>
        </div>
        {habits && habits.length > 0 && (
          <button
            className={`mood-legend-toggle${showLegend ? ' active' : ''}`}
            onClick={() => setShowLegend(s => !s)}
          >
            Legend
          </button>
        )}
      </div>
      {showLegend && habits && habits.length > 0 && (
        <div className="mood-legend">
          {habits.map(h => (
            <span key={h.id} className="mood-legend-item">
              <span>{h.emoji}</span>{h.name}
            </span>
          ))}
        </div>
      )}
      {view === '3month' ? (
        <div className="mood-calendar-months">
          {threeMonths.map(({ year: y, month: m }) => renderMonth(y, m, false))}
        </div>
      ) : (
        <div className="mood-calendar-months year-view">
          {yearMonths.map(({ year: y, month: m }) => renderMonth(y, m, true))}
        </div>
      )}
    </div>
  );
}
