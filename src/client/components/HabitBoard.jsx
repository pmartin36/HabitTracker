import React from 'react';

function todayString() {
  return new Date().toISOString().split('T')[0];
}

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
          <div className="habit-actions">
            <button onClick={() => onStatusChange(habit.id, today, 'pass')}>Done!</button>
            <button onClick={() => onStatusChange(habit.id, today, 'skip')}>Skip</button>
            <button onClick={() => onStatusChange(habit.id, today, 'fail')}>Fail</button>
          </div>
        </div>
      ))}
      {habits.length < 5 && (
        <button onClick={onAddHabit}>+</button>
      )}
    </div>
  );
}
