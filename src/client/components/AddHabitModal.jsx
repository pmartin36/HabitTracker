import React, { useState, useEffect, useRef } from 'react';

const EMOJI_OPTIONS = ['🏃', '💧', '📚', '😴', '🧘', '✍️', '🎯', '💪', '🥗', '🎸'];

export default function AddHabitModal({ onSubmit, onClose }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏃');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Habit name is required.');
      return;
    }
    onSubmit(name.trim(), emoji);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="Add new habit">
        <h2 className="modal-title">New Habit</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-label" htmlFor="habit-name">Name</label>
            <input
              id="habit-name"
              ref={inputRef}
              type="text"
              className="modal-input"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Morning run"
              autoComplete="off"
            />
            {error && <p className="modal-error">{error}</p>}
          </div>
          <div className="modal-field">
            <label className="modal-label">Emoji</label>
            <div className="emoji-grid">
              {EMOJI_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`emoji-option${emoji === opt ? ' selected' : ''}`}
                  onClick={() => setEmoji(opt)}
                  aria-label={opt}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="submit" className="modal-submit">Add Habit</button>
            <button type="button" className="modal-cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
