import React, { useState, useEffect } from 'react';
import HabitBoard from './components/HabitBoard.jsx';
import MobileHabitView from './components/MobileHabitView.jsx';
import MoodStrip from './components/MoodStrip.jsx';
import MoodCalendar from './components/MoodCalendar.jsx';
import { todayString } from './utils/date.js';

export default function App() {
  const [habits, setHabits] = useState([]);
  const [entries, setEntries] = useState([]);
  const [moods, setMoods] = useState([]);
  const [showMoodCalendar, setShowMoodCalendar] = useState(false);

  const today = todayString();
  const currentMonth = today.slice(0, 7); // YYYY-MM
  const isDesktop = window.innerWidth >= 768;

  const fetchEntries = async () => {
    const res = await fetch(`/api/entries?month=${currentMonth}`);
    const data = await res.json();
    setEntries(data);
  };

  useEffect(() => {
    const init = async () => {
      const [habitsRes, moodRes] = await Promise.all([
        fetch('/api/habits'),
        fetch(`/api/mood?month=${currentMonth}`),
      ]);
      const [habitsData, moodData] = await Promise.all([
        habitsRes.json(),
        moodRes.json(),
      ]);
      setHabits(habitsData);
      setMoods(moodData);
      await fetchEntries();
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
  };

  const handleMoodChange = async (rating) => {
    await fetch('/api/mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, rating }),
    });
  };

  const todayMood = moods.find((m) => m.date === today && m.rating != null);

  return (
    <div className="app">
      <MoodStrip
        currentRating={todayMood?.rating}
        isEditable={true}
        onRatingChange={handleMoodChange}
      />
      {todayMood && (
        <button onClick={() => setShowMoodCalendar((v) => !v)}>
          Mood Calendar
        </button>
      )}
      {showMoodCalendar && <MoodCalendar moods={moods} />}
      {isDesktop ? (
        <HabitBoard
          habits={habits}
          entries={entries}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <MobileHabitView
          habits={habits}
          entries={entries}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
