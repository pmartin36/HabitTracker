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
  const [touchStartX, setTouchStartX] = useState(null);
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

  const hasAddSlot = habits.length < 5;
  const totalSlots = habits.length + (hasAddSlot ? 1 : 0);
  const isAddSlot = index === habits.length && hasAddSlot;

  const habit = !isAddSlot ? habits[index] : null;
  const habitEntries = habit ? entries.filter(e => e.habit_id === habit.id) : [];
  const todayEntry = habit ? habitEntries.find(e => e.date === today) : null;
  const currentStatus = todayEntry?.status;

  return (
    <div
      className="mobile-habit-view"
      onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={e => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        setTouchStartX(null);
        if (Math.abs(dx) < 50) return;
        if (dx < 0) setIndex(i => (i + 1) % totalSlots);
        else        setIndex(i => (i - 1 + totalSlots) % totalSlots);
      }}
    >
      {isAddSlot ? (
        <div className="mobile-add-card" onClick={onAddHabit}>
          <span className="mobile-add-icon">+</span>
          <span className="mobile-add-label">Add habit</span>
        </div>
      ) : (
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
          <AnimatedStreak key={habit.id} value={streaks[habit.id] ?? 0} />
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
      )}
      <div className="indicator-dots">
        {Array.from({ length: totalSlots }, (_, i) => (
          <span key={i} data-testid={`indicator-dot-${i}`} className={`indicator-dot${i === index ? ' active' : ''}`} />
        ))}
      </div>
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
