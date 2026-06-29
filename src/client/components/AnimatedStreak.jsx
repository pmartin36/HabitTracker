import React, { useState, useEffect, useRef } from 'react';

export default function AnimatedStreak({ value }) {
  const [anim, setAnim] = useState({ from: value, to: value, running: false, dir: 'up' });
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    const dir = value > prev.current ? 'up' : 'down';
    setAnim({ from: prev.current, to: value, running: true, dir });
    prev.current = value;
    const t = setTimeout(() => setAnim(a => ({ ...a, running: false })), 400);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="streak">
      <div className="streak-number-wrap">
        {anim.running ? (
          <>
            <span className={`streak-number sn-exit-${anim.dir}`}>{anim.from}</span>
            <span className={`streak-number sn-enter-${anim.dir}`}>{anim.to}</span>
          </>
        ) : (
          <span className="streak-number">{value}</span>
        )}
      </div>
      <span className="streak-label">day streak</span>
    </div>
  );
}
