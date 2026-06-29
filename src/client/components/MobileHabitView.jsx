import React, { useState } from 'react';
import { todayString } from '../utils/date.js';
import HabitActions from './HabitActions.jsx';

export default function MobileHabitView({ habits, entries, onStatusChange, onAddHabit }) {
  const [index, setIndex] = useState(0);
  const today = todayString();

  if (habits.length === 0) {
    return (
      <div className="mobile-habit-view">
        <p className="empty-state">Add your first habit →</p>
        {onAddHabit && (
          <button className="add-habit-btn" onClick={onAddHabit} aria-label="Add habit">
            +
          </button>
        )}
      </div>
    );
  }

  const habit = habits[index];
  const isFirst = index === 0;
  const isLast = index === habits.length - 1;

  return (
    <div className="mobile-habit-view">
      <div className="habit-card">
        <span className="habit-name">
          {habit.emoji && <span className="habit-emoji">{habit.emoji} </span>}
          {habit.name}
        </span>
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
        <button
          aria-label="Previous"
          className="nav-btn"
          onClick={() => setIndex(i => i - 1)}
          disabled={isFirst}
        >
          ‹
        </button>
        <button
          aria-label="Next"
          className="nav-btn"
          onClick={() => setIndex(i => i + 1)}
          disabled={isLast}
        >
          ›
        </button>
      </div>
      {habits.length < 5 && onAddHabit && (
        <button className="add-habit-btn mobile-add" onClick={onAddHabit} aria-label="Add habit">
          +
        </button>
      )}
    </div>
  );
}
