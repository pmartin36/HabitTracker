import React from 'react';
import { todayString } from '../utils/date.js';
import HabitActions from './HabitActions.jsx';
import MiniCalendar from './MiniCalendar.jsx';

export default function HabitBoard({ habits, entries, onStatusChange, onAddHabit, streaks = {} }) {
  const today = todayString();
  const currentYear = parseInt(today.slice(0, 4), 10);
  const currentMonth = parseInt(today.slice(5, 7), 10);

  return (
    <div className="habit-board">
      {habits.map(habit => {
        const habitEntries = entries.filter(e => e.habit_id === habit.id);
        const todayEntry = habitEntries.find(e => e.date === today);
        const currentStatus = todayEntry?.status;
        return (
          <div
            key={habit.id}
            data-testid={`habit-card-${habit.id}`}
            className="habit-card"
          >
            <span className="habit-name">{habit.name}</span>
            <HabitActions
              habitId={habit.id}
              date={today}
              onStatusChange={onStatusChange}
              currentStatus={currentStatus}
            />
            <div className="streak">
              <span className="streak-number">{streaks[habit.id] ?? 0}</span>
              <span className="streak-label">day streak</span>
            </div>
            <div data-testid={`mini-calendar-${habit.id}`}>
              <MiniCalendar
                habitId={habit.id}
                entries={habitEntries}
                onStatusChange={(date, status) => onStatusChange(habit.id, date, status)}
                year={currentYear}
                month={currentMonth}
              />
            </div>
          </div>
        );
      })}
      {habits.length < 5 && (
        <button onClick={onAddHabit}>+</button>
      )}
    </div>
  );
}
