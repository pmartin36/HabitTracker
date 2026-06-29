import React, { useState, useEffect } from 'react';
import { todayString, addDays } from '../utils/date.js';

export default function CheckInModal({ onClose }) {
  const [habits, setHabits] = useState([]);
  const [entries, setEntries] = useState({}); // { habitId: status }
  const [mood, setMood] = useState(null);
  const [moodLocked, setMoodLocked] = useState(false);

  const today = todayString();
  const yesterday = addDays(today, -1);

  useEffect(() => {
    async function load() {
      const [habitsData, entriesData, moodData] = await Promise.all([
        fetch('/api/habits').then(r => r.json()),
        fetch(`/api/entries?month=${yesterday.slice(0, 7)}`).then(r => r.json()),
        fetch(`/api/mood?month=${yesterday.slice(0, 7)}`).then(r => r.json()),
      ]);
      setHabits(habitsData);

      // Build entry status map for yesterday
      const map = {};
      for (const e of entriesData) {
        if (e.date === yesterday) map[e.habit_id] = e.status;
      }
      setEntries(map);

      const yMood = moodData.find(m => m.date === yesterday);
      if (yMood) {
        setMood(yMood.rating);
        setMoodLocked(yMood.locked);
      }
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC key closes modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function setHabitStatus(habitId, status) {
    if (status === 'pending') {
      await fetch('/api/entries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: habitId, date: yesterday }),
      });
      setEntries(e => { const n = { ...e }; delete n[habitId]; return n; });
    } else {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: habitId, date: yesterday, status }),
      });
      setEntries(e => ({ ...e, [habitId]: status }));
    }
  }

  async function setMoodRating(rating) {
    if (moodLocked) return;
    await fetch('/api/mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: yesterday, rating }),
    });
    setMood(rating);
  }

  const MOOD_ICONS = ['😣', '🙁', '😐', '🙂', '😄'];

  return (
    <div className="checkin-modal-overlay">
      <div className="checkin-modal">
        <div className="checkin-header">
          <h1 className="checkin-title">Morning Check-In</h1>
          <p className="checkin-date">{yesterday}</p>
        </div>

        <section className="checkin-section">
          <h2 className="checkin-section-title">How was yesterday?</h2>
          <div className="checkin-mood-row">
            {MOOD_ICONS.map((icon, i) => {
              const rating = MOOD_ICONS.length - i; // 5,4,3,2,1 left to right
              return (
                <button
                  key={rating}
                  className={`checkin-mood-btn ${mood === rating ? 'active' : ''} ${moodLocked ? 'locked' : ''}`}
                  onClick={() => setMoodRating(rating)}
                  disabled={moodLocked}
                >
                  {icon}
                </button>
              );
            })}
          </div>
          {moodLocked && <p className="checkin-locked-note">Mood is locked for this day.</p>}
        </section>

        <section className="checkin-section">
          <h2 className="checkin-section-title">Habits</h2>
          <div className="checkin-habits">
            {habits.map(habit => {
              const status = entries[habit.id] ?? 'pending';
              return (
                <div key={habit.id} className={`checkin-habit-card status-bg-${status}`}>
                  <div className="checkin-habit-name">
                    <span>{habit.emoji}</span>
                    <span>{habit.name}</span>
                  </div>
                  <div className="checkin-habit-actions">
                    <button
                      className={`checkin-btn checkin-btn-pass ${status === 'pass' ? 'active' : ''}`}
                      onClick={() => setHabitStatus(habit.id, status === 'pass' ? 'pending' : 'pass')}
                    >Done!</button>
                    <button
                      className={`checkin-btn checkin-btn-skip ${status === 'skip' ? 'active' : ''}`}
                      onClick={() => setHabitStatus(habit.id, status === 'skip' ? 'pending' : 'skip')}
                    >Skip</button>
                    <button
                      className={`checkin-btn checkin-btn-fail ${status === 'fail' ? 'active' : ''}`}
                      onClick={() => setHabitStatus(habit.id, status === 'fail' ? 'pending' : 'fail')}
                    >Fail</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="checkin-modal-footer">
          <button className="checkin-done-btn" onClick={onClose}>Done</button>
          <button className="checkin-dismiss-btn" onClick={onClose}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}
