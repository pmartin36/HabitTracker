import React, { useState } from 'react';
import { nextStatus } from '../utils/status.js';
import { MONTH_NAMES, formatDate, daysInMonth, todayString, addDays } from '../utils/date.js';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function generateMonths(initialYear) {
  const months = [];
  for (let m = 1; m <= 12; m++) {
    months.push({ year: initialYear, month: m });
  }
  return months; // Jan first, Dec last
}

export default function FullCalendar({ entries, onStatusChange, initialYear, initialMonth, createdAt, today: todayProp }) {
  const months = generateMonths(initialYear);
  const entryMap = Object.fromEntries(entries.map(e => [e.date, e.status]));

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
    <div className="full-calendar">
      {months.map(({ year, month }) => {
        const total = daysInMonth(year, month);
        const firstDOW = new Date(year, month - 1, 1).getDay(); // 0 = Sunday

        const prevMonthNum = month === 1 ? 12 : month - 1;
        const prevMonthYear = month === 1 ? year - 1 : year;
        const prevMonthTotal = daysInMonth(prevMonthYear, prevMonthNum);

        const cells = [];
        for (let i = 0; i < firstDOW; i++) {
          const d = prevMonthTotal - firstDOW + 1 + i;
          const dateStr = formatDate(prevMonthYear, prevMonthNum, d);
          cells.push({ key: `overflow-${dateStr}`, overflow: true, day: d, dateStr });
        }
        for (let d = 1; d <= total; d++) {
          const dateStr = formatDate(year, month, d);
          cells.push({
            key: dateStr,
            overflow: false,
            day: d,
            dateStr,
            status: entryMap[dateStr] ?? 'pending',
          });
        }

        return (
          <div key={`${year}-${month}`} className="full-calendar-month">
            <div className="full-calendar-month-heading">
              {MONTH_NAMES[month - 1]} {year}
            </div>
            <div className="full-calendar-dow">
              {DOW_LABELS.map(d => <span key={d}>{d}</span>)}
            </div>
            <div className="full-calendar-grid">
              {cells.map(cell => {
                if (cell.overflow) {
                  return (
                    <div key={cell.key} className="day overflow-day">
                      {cell.day}
                    </div>
                  );
                }
                const isEditable = cell.dateStr === todayStr || cell.dateStr === yesterdayStr;
                const isFuture = cell.dateStr > todayStr;
                return (
                  <div
                    key={cell.key}
                    data-testid={`day-${cell.dateStr}`}
                    className={[
                      'day',
                      isFuture ? 'future' : `status-${cell.status}`,
                      !isEditable && !isFuture ? 'locked-day' : '',
                      flashingDate === cell.dateStr ? 'flash-locked' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => handleCellClick(cell.dateStr, cell.status)}
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
