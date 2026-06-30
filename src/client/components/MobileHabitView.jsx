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
  const [transition, setTransition] = useState(null);
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

  function navigate(dir) {
    const next = dir === 'left'
      ? (index + 1) % totalSlots
      : (index - 1 + totalSlots) % totalSlots;
    setIndex(next);
    setTransition({ dir });
    setTimeout(() => setTransition(null), 280);
  }

  function renderSlot(idx) {
    const isAdd = idx === habits.length && hasAddSlot;
    if (isAdd) {
      return (
        <div className="mobile-add-card" onClick={onAddHabit}>
          <span className="mobile-add-icon">+</span>
          <span className="mobile-add-label">Add habit</span>
        </div>
      );
    }
    const h = habits[idx];
    const habitEntries = entries.filter(e => e.habit_id === h.id);
    const todayEntry = habitEntries.find(e => e.date === today);
    const currentStatus = todayEntry?.status;
    return (
      <div className="habit-card">
        <div className="card-header">
          <span className="habit-emoji">{h.emoji}</span>
          <span className="habit-name">{h.name}</span>
          <button
            className="edit-btn"
            onClick={() => setEditingHabit(h)}
            aria-label={`Edit ${h.name}`}
          >
            ✎
          </button>
        </div>
        <HabitActions
          habitId={h.id}
          date={today}
          onStatusChange={onStatusChange}
          currentStatus={currentStatus}
        />
        <AnimatedStreak key={h.id} value={streaks[h.id] ?? 0} />
        <div data-testid={`mini-calendar-${h.id}`}>
          <MiniCalendar
            habitId={h.id}
            entries={habitEntries}
            onStatusChange={(date, status) => onStatusChange(h.id, date, status)}
            year={currentYear}
            month={currentMonth}
          />
        </div>
        <button className="full-cal-link" onClick={() => setCalendarHabit(h)}>
          Full Calendar →
        </button>
      </div>
    );
  }

  return (
    <div
      className="mobile-habit-view"
      onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={e => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        setTouchStartX(null);
        if (Math.abs(dx) < 50) return;
        if (dx < 0) navigate('left');
        else        navigate('right');
      }}
    >
      <div className="card-stage">
        <div key={index} className={`card-slot${transition ? ` enter-${transition.dir}` : ''}`}>
          {renderSlot(index)}
        </div>
      </div>
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
