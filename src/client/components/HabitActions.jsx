import React from 'react';

export default function HabitActions({ habitId, date, onStatusChange }) {
  return (
    <div className="habit-actions">
      <button onClick={() => onStatusChange(habitId, date, 'pass')}>Done!</button>
      <button onClick={() => onStatusChange(habitId, date, 'skip')}>Skip</button>
      <button onClick={() => onStatusChange(habitId, date, 'fail')}>Fail</button>
    </div>
  );
}
