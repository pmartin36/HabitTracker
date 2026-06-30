import React, { useState, useEffect, useRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

export default function AddHabitModal({ onSubmit, onReinstate, onClose }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [error, setError] = useState('');
  const [archived, setArchived] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetch('/api/habits/archived')
      .then(r => r.json())
      .then(setArchived)
      .catch(() => {});
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

  const handleEmojiSelect = (emojiData) => {
    setEmoji(emojiData.native);
  };

  const handleReinstate = async (id) => {
    await onReinstate(id);
    onClose();
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
            <label className="modal-label">
              Emoji <span className="selected-emoji">{emoji}</span>
            </label>
            <div className="emoji-picker-wrap">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="dark"
                previewPosition="none"
                skinTonePosition="none"
                perLine={8}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="submit" className="modal-submit">Add Habit</button>
            <button type="button" className="modal-cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>

        {archived.length > 0 && (
          <div className="archived-habits-section">
            <div className="archived-habits-heading">Past habits</div>
            <div className="archived-habits-list">
              {archived.map(h => (
                <div key={h.id} className="archived-habit-row">
                  <span className="archived-habit-name">
                    <span>{h.emoji}</span>{h.name}
                  </span>
                  <button
                    type="button"
                    className="archived-habit-resume"
                    onClick={() => handleReinstate(h.id)}
                  >
                    Resume
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
