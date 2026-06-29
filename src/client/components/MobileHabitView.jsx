import React, { useState } from 'react';
import { todayString } from '../utils/date.js';
import HabitActions from './HabitActions.jsx';
import MiniCalendar from './MiniCalendar.jsx';
import AnimatedStreak from './AnimatedStreak.jsx';
import EditHabitModal from './EditHabitModal.jsx';
import CalendarModal from './CalendarModal.jsx';

export default function MobileHabitView({
  habits,
  entries,
  onStatusChange,
  onAddHabit,
  streaks = {},
  onEditHabit = () => {},
  onDeleteHabit = () => {},
}) {
  const [index, setIndex] = useState(0);
  const [editingHabit, setEditingHabit] = useState(null);
  const [calendarHabit, setCalendarHabit] = useState(null);
  const today = todayString();
  const currentYear = parseInt(today.slice(0, 4), 10);
  const currentMonth = parseInt(today.slice(5, 7), 10);

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

  const habitEntries = entries.filter(e => e.habit_id === habit.id);
  const todayEntry = habitEntries.find(e => e.date === today);
  const currentStatus = todayEntry?.status;

  return (
    <div className="mobile-habit-view">
      <div className="habit-card">
        <div className="card-header">
          <span className="habit-emoji">{habit.emoji}</span>
          <span className="habit-name">{habit.name}</span>
          <button
            className="edit-btn"
            onClick={() => setEditingHabit(habit)}
            aria-label={`Edit ${habit.name}`}
          >
            ✎
          </button>
        </div>
        <HabitActions
          habitId={habit.id}
          date={today}
          onStatusChange={onStatusChange}
          currentStatus={currentStatus}
        />
        <AnimatedStreak value={streaks[habit.id] ?? 0} />
        <div data-testid={`mini-calendar-${habit.id}`}>
          <MiniCalendar
            habitId={habit.id}
            entries={habitEntries}
            onStatusChange={(date, status) => onStatusChange(habit.id, date, status)}
            year={currentYear}
            month={currentMonth}
          />
        </div>
        <button className="full-cal-link" onClick={() => setCalendarHabit(habit)}>
          Full Calendar →
        </button>
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
      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          onSave={(id, name, emoji) => {
            onEditHabit(id, name, emoji);
            setEditingHabit(null);
          }}
          onDelete={(id) => {
            onDeleteHabit(id);
            setEditingHabit(null);
          }}
          onClose={() => setEditingHabit(null)}
        />
      )}
      {calendarHabit && (
        <CalendarModal
          habit={calendarHabit}
          entries={entries}
          onStatusChange={(habitId, date, status) => onStatusChange(habitId, date, status)}
          onClose={() => setCalendarHabit(null)}
          currentYear={currentYear}
          currentMonth={currentMonth}
        />
      )}
    </div>
  );
}
