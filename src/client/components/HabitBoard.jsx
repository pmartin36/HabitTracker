import React, { useState } from 'react';
import { todayString } from '../utils/date.js';
import HabitActions from './HabitActions.jsx';
import MiniCalendar from './MiniCalendar.jsx';
import AnimatedStreak from './AnimatedStreak.jsx';
import EditHabitModal from './EditHabitModal.jsx';
import CalendarModal from './CalendarModal.jsx';

export default function HabitBoard({
  habits,
  entries,
  onStatusChange,
  onAddHabit,
  streaks = {},
  onEditHabit = () => {},
  onDeleteHabit = () => {},
  onReorderHabits = () => {},
  currentYear,
  currentMonth,
}) {
  const today = todayString();
  const year = currentYear ?? parseInt(today.slice(0, 4), 10);
  const month = currentMonth ?? parseInt(today.slice(5, 7), 10);

  const [editingHabit, setEditingHabit] = useState(null);
  const [calendarHabit, setCalendarHabit] = useState(null);
  const [passingHabit, setPassingHabit] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  function handleStatusChange(habitId, date, status) {
    if (status === 'pass') {
      setPassingHabit(habitId);
      setTimeout(() => setPassingHabit(null), 800);
    }
    onStatusChange(habitId, date, status);
  }

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
            className={`habit-card${passingHabit === habit.id ? ' just-passed' : ''}${dragOver === habit.id ? ' drag-over' : ''}`}
            draggable
            onDragStart={() => setDragId(habit.id)}
            onDragOver={e => { e.preventDefault(); setDragOver(habit.id); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => {
              if (dragId !== habit.id) onReorderHabits(dragId, habit.id);
              setDragId(null);
              setDragOver(null);
            }}
            onDragEnd={() => { setDragId(null); setDragOver(null); }}
            style={dragId === habit.id ? { opacity: 0.4 } : undefined}
          >
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
              onStatusChange={handleStatusChange}
              currentStatus={currentStatus}
            />
            <AnimatedStreak value={streaks[habit.id] ?? 0} />
            <div data-testid={`mini-calendar-${habit.id}`}>
              <MiniCalendar
                habitId={habit.id}
                entries={habitEntries}
                onStatusChange={(date, status) => handleStatusChange(habit.id, date, status)}
                year={year}
                month={month}
              />
            </div>
            <button
              className="full-cal-link"
              onClick={() => setCalendarHabit(habit)}
            >
              Full Calendar →
            </button>
          </div>
        );
      })}
      {habits.length < 5 && (
        <button onClick={onAddHabit}>+</button>
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
          onStatusChange={handleStatusChange}
          onClose={() => setCalendarHabit(null)}
          currentYear={year}
          currentMonth={month}
        />
      )}
    </div>
  );
}
