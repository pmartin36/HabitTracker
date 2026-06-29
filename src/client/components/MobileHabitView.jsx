import React, { useState } from 'react';

function todayString() {
  return new Date().toISOString().split('T')[0];
}

export default function MobileHabitView({ habits, entries, onStatusChange }) {
  const [index, setIndex] = useState(0);
  const today = todayString();

  if (habits.length === 0) {
    return (
      <div className="mobile-habit-view">
        <p>No habits yet.</p>
      </div>
    );
  }

  const habit = habits[index];
  const isFirst = index === 0;
  const isLast = index === habits.length - 1;

  return (
    <div className="mobile-habit-view">
      <div className="habit-card">
        <span className="habit-name">{habit.name}</span>
        <div className="habit-actions">
          <button onClick={() => onStatusChange(habit.id, today, 'pass')}>Done!</button>
          <button onClick={() => onStatusChange(habit.id, today, 'skip')}>Skip</button>
          <button onClick={() => onStatusChange(habit.id, today, 'fail')}>Fail</button>
        </div>
      </div>
      <div className="indicator-dots">
        {habits.map((h, i) => (
          <span
            key={h.id}
            data-testid={`indicator-dot-${i}`}
            className={`indicator-dot${i === index ? ' active' : ''}`}
          />
        ))}
      </div>
      <div className="navigation">
        <button
          onClick={() => setIndex(i => i - 1)}
          disabled={isFirst}
          aria-disabled={isFirst ? 'true' : 'false'}
        >
          Previous
        </button>
        <button
          onClick={() => setIndex(i => i + 1)}
          disabled={isLast}
          aria-disabled={isLast ? 'true' : 'false'}
        >
          Next
        </button>
      </div>
    </div>
  );
}
