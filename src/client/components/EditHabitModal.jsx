import React, { useState, useEffect, useRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

export default function EditHabitModal({ habit, onSave, onDelete, onClose }) {
  const [name, setName] = useState(habit.name);
  const [emoji, setEmoji] = useState(habit.emoji || '🎯');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
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
    onSave(habit.id, name.trim(), emoji);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleEmojiSelect = (emojiData) => {
    setEmoji(emojiData.native);
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="Edit habit">
        <h2 className="modal-title">Edit Habit</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-label" htmlFor="edit-habit-name">Name</label>
            <input
              id="edit-habit-name"
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
            <button type="submit" className="modal-submit">Save</button>
            <button type="button" className="modal-cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>

        <div className="edit-delete-section">
          {!confirmDelete ? (
            <button
              type="button"
              className="delete-btn"
              onClick={() => setConfirmDelete(true)}
            >
              Delete Habit
            </button>
          ) : (
            <div className="delete-confirm">
              <span className="delete-confirm-text">Are you sure?</span>
              <button
                type="button"
                className="delete-confirm-yes"
                onClick={() => onDelete(habit.id)}
              >
                Yes, delete
              </button>
              <button
                type="button"
                className="delete-confirm-cancel"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
