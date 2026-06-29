import React, { useState, useEffect } from 'react';
import HabitBoard from './components/HabitBoard.jsx';
import MobileHabitView from './components/MobileHabitView.jsx';
import MoodStrip from './components/MoodStrip.jsx';
import MoodCalendar from './components/MoodCalendar.jsx';
import AddHabitModal from './components/AddHabitModal.jsx';
import { todayString } from './utils/date.js';

export default function App() {
  const [habits, setHabits] = useState([]);
  const [entries, setEntries] = useState([]);
  const [moods, setMoods] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [showMoodCalendar, setShowMoodCalendar] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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
      const [habitsData, moodData, entriesData, streaksData] = await Promise.all([
        fetch('/api/habits').then(r => r.json()),
        fetch(`/api/mood?month=${currentMonth}`).then(r => r.json()),
        fetch(`/api/entries?month=${currentMonth}`).then(r => r.json()),
        fetch('/api/streaks').then(r => r.json()),
      ]);
      setHabits(habitsData);
      setMoods(moodData);
      setEntries(entriesData);
      setStreaks(streaksData);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (habitId, date, status) => {
    await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habit_id: habitId, date, status }),
    });
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
        />
        {todayMood && (
          <button className="mood-cal-toggle" onClick={() => setShowMoodCalendar((v) => !v)}>
            {showMoodCalendar ? 'Hide Mood Calendar' : 'Mood Calendar'}
          </button>
        )}
      </div>
      {isDesktop ? (
        <HabitBoard
          habits={habits}
          entries={entries}
          onStatusChange={handleStatusChange}
          onAddHabit={onAddHabit}
          streaks={streaks}
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
          currentYear={currentYear}
          currentMonth={currentMonthNum}
        />
      )}
      {showMoodCalendar && (
        <div className="mood-calendar-section">
          <MoodCalendar
            moods={moods}
            habitPasses={habitPasses}
            initialYear={currentYear}
            initialMonth={currentMonthNum}
          />
        </div>
      )}
      {showAddModal && (
        <AddHabitModal
          onSubmit={handleAddHabitSubmit}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
