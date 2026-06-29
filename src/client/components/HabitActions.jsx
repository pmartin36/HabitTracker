import React from 'react';

export default function HabitActions({ habitId, date, onStatusChange, currentStatus }) {
  return (
    <div className="habit-actions">
      <button
        className={currentStatus === 'pass' ? 'active' : ''}
        onClick={() => onStatusChange(habitId, date, 'pass')}
      >Done!</button>
      <button
        className={currentStatus === 'skip' ? 'active' : ''}
        onClick={() => onStatusChange(habitId, date, 'skip')}
      >Skip</button>
      <button
        className={currentStatus === 'fail' ? 'active' : ''}
        onClick={() => onStatusChange(habitId, date, 'fail')}
      >Fail</button>
    </div>
  );
}
