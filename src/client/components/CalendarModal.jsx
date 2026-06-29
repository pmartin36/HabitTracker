import React, { useEffect, useState } from 'react';
import FullCalendar from './FullCalendar.jsx';

export default function CalendarModal({ habit, entries, onStatusChange, onClose, currentYear, currentMonth }) {
  // Seed with entries already in memory (current month), then fetch full history
  const [allEntries, setAllEntries] = useState(entries.filter(e => e.habit_id === habit.id));

  useEffect(() => {
    fetch(`/api/entries/${habit.id}`)
      .then(r => r.json())
      .then(data => setAllEntries(data))
      .catch(() => {}); // fall back to in-memory entries on error
  }, [habit.id]);

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
          entries={allEntries}
          onStatusChange={(date, status) => onStatusChange(habit.id, date, status)}
          initialYear={currentYear}
          initialMonth={currentMonth}
          createdAt={habit.created_at}
        />
      </div>
    </div>
  );
}
