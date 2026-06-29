import React, { useState } from 'react';
import { todayString } from '../utils/date.js';
import HabitActions from './HabitActions.jsx';

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
        <HabitActions habitId={habit.id} date={today} onStatusChange={onStatusChange} />
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
        <button onClick={() => setIndex(i => i - 1)} disabled={isFirst}>Previous</button>
        <button onClick={() => setIndex(i => i + 1)} disabled={isLast}>Next</button>
      </div>
    </div>
  );
}
