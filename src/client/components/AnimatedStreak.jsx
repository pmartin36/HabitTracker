import React, { useState, useEffect, useRef } from 'react';

export default function AnimatedStreak({ value }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animClass, setAnimClass] = useState('');
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    const increasing = value > prevValue.current;
    setAnimClass(increasing ? 'streak-roll-up' : 'streak-roll-down');
    const t = setTimeout(() => {
      setDisplayValue(value);
      setAnimClass('');
    }, 300);
    prevValue.current = value;
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="streak">
      <div className={`streak-number-wrap ${animClass}`}>
        <span className="streak-number">{displayValue}</span>
      </div>
      <span className="streak-label">day streak</span>
    </div>
  );
}
