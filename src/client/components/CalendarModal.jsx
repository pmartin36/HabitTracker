import React, { useEffect } from 'react';
import FullCalendar from './FullCalendar.jsx';

export default function CalendarModal({ habit, entries, onStatusChange, onClose, currentYear, currentMonth }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const habitEntries = entries.filter(e => e.habit_id === habit.id);

  return (
    <div className="calendar-modal-overlay" onClick={handleOverlayClick}>
      <div className="calendar-modal">
        <div className="calendar-modal-header">
          <h2>{habit.emoji} {habit.name}</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <FullCalendar
          habitId={habit.id}
          entries={habitEntries}
          onStatusChange={(date, status) => onStatusChange(habit.id, date, status)}
          initialYear={currentYear}
          initialMonth={currentMonth}
        />
      </div>
    </div>
  );
}
