import React, { useState, useEffect } from 'react';
import HabitBoard from './components/HabitBoard.jsx';
import MobileHabitView from './components/MobileHabitView.jsx';
import MoodStrip from './components/MoodStrip.jsx';
import MoodCalendar from './components/MoodCalendar.jsx';
import AddHabitModal from './components/AddHabitModal.jsx';
import CheckInModal from './components/CheckInModal.jsx';
import { todayString } from './utils/date.js';

export default function App() {
  const [habits, setHabits] = useState([]);
  const [entries, setEntries] = useState([]);
  const [moods, setMoods] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [showMoodCalendar, setShowMoodCalendar] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(() => window.location.pathname === '/checkin');
  const [isDesktop] = useState(() => window.innerWidth >= 768);

  const today = todayString();
  const currentMonth = today.slice(0, 7);
  const currentYear = parseInt(today.slice(0, 4), 10);
  const currentMonthNum = parseInt(today.slice(5, 7), 10);

  const fetchHabits = async () => {
    const data = await fetch('/api/habits').then(r => r.json());
    setHabits(data);
  };

  const fetchEntries = async () => {
    const data = await fetch(`/api/entries?month=${currentMonth}`).then(r => r.json());
    setEntries(data);
  };

  const fetchMoods = async () => {
    const data = await fetch(`/api/mood?month=${currentMonth}`).then(r => r.json());
    setMoods(data);
  };

  const fetchStreaks = async () => {
    const data = await fetch('/api/streaks').then(r => r.json());
    setStreaks(data);
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchHabits(),
        fetchMoods(),
        fetchEntries(),
        fetchStreaks(),
      ]);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (habitId, date, status) => {
    if (status === 'pending') {
      await fetch('/api/entries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: habitId, date }),
      });
    } else {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: habitId, date, status }),
      });
    }
    await fetchEntries();
    await fetchStreaks();
  };

  const handleMoodChange = async (rating) => {
    await fetch('/api/mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, rating }),
    });
    await fetchMoods();
  };

  const handleEditHabit = async (id, name, emoji) => {
    await fetch(`/api/habits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji }),
    });
    await fetchHabits();
  };

  const handleDeleteHabit = async (id) => {
    await fetch(`/api/habits/${id}`, {
      method: 'DELETE',
    });
    await fetchHabits();
  };

  const handleReorderHabits = async (draggedId, targetId) => {
    const reordered = [...habits];
    const fromIdx = reordered.findIndex(h => h.id === draggedId);
    const toIdx   = reordered.findIndex(h => h.id === targetId);
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    // Optimistic update
    setHabits(reordered);
    // Persist
    await fetch('/api/habits/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reordered.map((h, i) => ({ id: h.id, sort_order: i + 1 }))),
    });
  };

  const onAddHabit = () => setShowAddModal(true);

  const handleAddHabitSubmit = async (name, emoji) => {
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji }),
    });
    await fetchHabits();
    setShowAddModal(false);
  };

  const recentMoods = Array.from({ length: 5 }, (_, i) => {
    // i=0 is 4 days ago, i=4 is today
    const d = new Date(today + 'T12:00:00');
    d.setDate(d.getDate() - (4 - i));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return moods.find(m => m.date === dateStr) ?? null;
  });

  const todayMood = moods.find((m) => m.date === today && m.rating != null);

  const habitPasses = entries
    .filter((e) => e.status === 'pass')
    .map((e) => {
      const habit = habits.find((h) => h.id === e.habit_id);
      return { date: e.date, emoji: habit?.emoji };
    });

  return (
    <div className="app">
      <div className="mood-strip-container">
        <MoodStrip
          currentRating={todayMood?.rating}
          isEditable={!todayMood?.locked}
          onRatingChange={handleMoodChange}
          showCalendarButton={true}
          showingCalendar={showMoodCalendar}
          onToggleCalendar={() => setShowMoodCalendar((v) => !v)}
          recentMoods={recentMoods}
        />
      </div>
      {showMoodCalendar && (
        <div className="mood-calendar-panel">
          <MoodCalendar
            moods={moods}
            habitPasses={habitPasses}
            initialYear={currentYear}
            initialMonth={currentMonthNum}
          />
        </div>
      )}
      {isDesktop ? (
        <HabitBoard
          habits={habits}
          entries={entries}
          onStatusChange={handleStatusChange}
          onAddHabit={onAddHabit}
          streaks={streaks}
          onEditHabit={handleEditHabit}
          onDeleteHabit={handleDeleteHabit}
          onReorderHabits={handleReorderHabits}
          currentYear={currentYear}
          currentMonth={currentMonthNum}
        />
      ) : (
        <MobileHabitView
          habits={habits}
          entries={entries}
          onStatusChange={handleStatusChange}
          onAddHabit={onAddHabit}
          streaks={streaks}
          onEditHabit={handleEditHabit}
          onDeleteHabit={handleDeleteHabit}
          currentYear={currentYear}
          currentMonth={currentMonthNum}
        />
      )}
      {showAddModal && (
        <AddHabitModal
          onSubmit={handleAddHabitSubmit}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {showCheckinModal && (
        <CheckInModal
          onClose={() => {
            setShowCheckinModal(false);
            window.history.replaceState({}, '', '/');
          }}
        />
      )}
    </div>
  );
}
