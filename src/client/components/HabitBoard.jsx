import React from 'react';
import { todayString } from '../utils/date.js';
import HabitActions from './HabitActions.jsx';

export default function HabitBoard({ habits, entries, onStatusChange, onAddHabit }) {
  const today = todayString();

  return (
    <div className="habit-board">
      {habits.map(habit => (
        <div
          key={habit.id}
          data-testid={`habit-card-${habit.id}`}
          className="habit-card"
        >
          <span className="habit-name">{habit.name}</span>
          <HabitActions habitId={habit.id} date={today} onStatusChange={onStatusChange} />
        </div>
      ))}
      {habits.length < 5 && (
        <button onClick={onAddHabit}>+</button>
      )}
    </div>
  );
}
