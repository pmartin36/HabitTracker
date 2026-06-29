import React from 'react';

const ICONS = ['😄', '🙂', '😐', '🙁', '😣'];

export default function MoodStrip({ currentRating, isEditable, onRatingChange }) {
  return (
    <div className={`mood-strip${isEditable ? '' : ' locked'}`}>
      {ICONS.map((icon, i) => {
        const rating = i + 1;
        return (
          <span
            key={rating}
            data-testid={`mood-icon-${rating}`}
            className={`mood-icon${currentRating === rating ? ' active' : ''}`}
            onClick={isEditable ? () => onRatingChange(rating) : undefined}
          >
            {icon}
          </span>
        );
      })}
    </div>
  );
}
