import React from 'react';

// Ordered rough→great so that 😣 (rating 5) appears on the LEFT
// and 😄 (rating 1) appears on the RIGHT.
const ICONS = ['😣', '🙁', '😐', '🙂', '😄'];

export default function MoodStrip({ currentRating, isEditable, onRatingChange }) {
  return (
    <div className={`mood-strip${isEditable ? '' : ' locked'}`}>
      {ICONS.map((icon, i) => {
        // rating counts down: index 0 → 5, index 4 → 1
        const rating = ICONS.length - i;
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
