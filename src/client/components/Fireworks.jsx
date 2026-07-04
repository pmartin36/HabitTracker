import React, { useEffect, useRef } from 'react';

const TYPES = ['peony', 'chrysanthemum', 'willow', 'crackle'];
const HUE_FAMILIES = [140, 35, 355, 205, 320]; // sage, amber, rose, sky, magenta
const SPEED_MULT = 1.2;

function rand(a, b) {
  return a + Math.random() * (b - a);
}

/**
 * Full-viewport canvas overlay that renders a short fireworks show behind the
 * app content. Sits idle until `trigger` changes to a new truthy value, then
 * fires once and stops — no ambient/looping animation.
 */
export default function Fireworks({ trigger }) {
  const canvasRef = useRef(null);
  const fireRef = useRef(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // no 2D canvas support in this environment

    const state = { W: 0, H: 0, particles: [], rockets: [], running: false, pendingTimers: [] };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.W = window.innerWidth;
      state.H = window.innerHeight;
      canvas.width = state.W * dpr;
      canvas.height = state.H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function stopAll() {
      state.pendingTimers.forEach(window.clearTimeout);
      state.pendingTimers = [];
      state.rockets = [];
      state.particles = [];
      state.running = false;
      ctx.clearRect(0, 0, state.W, state.H);
    }

    // If the tab is backgrounded mid-show, background timers get throttled and
    // can all fire in a batch on refocus — kill anything pending/in-flight instead
    // of letting a backlog build up.
    function onVisibility() {
      if (document.hidden) stopAll();
    }
    document.addEventListener('visibilitychange', onVisibility);

    function spawnRocket(x0, targetX, targetY, hue, type) {
      state.rockets.push({
        x: x0,
        y: state.H + 6,
        vx: ((targetX - x0) * SPEED_MULT) / (state.H * 0.0957),
        vy: -Math.sqrt(state.H + 6 - targetY) * 0.391 * SPEED_MULT,
        gravity: 0.0575 * SPEED_MULT,
        hue,
        type,
        targetY,
        trail: [],
      });
    }

    function explode(x, y, hue, type) {
      let n, speedMin, speedMax, gravity, drag, decayMin, decayMax, trailLen, hueJitter;
      const scale = Math.max(0.6, Math.min(1.15, state.H / 820));
      switch (type) {
        case 'willow':
          n = 80; speedMin = 2.1; speedMax = 4.6; gravity = 0.1 * scale; drag = 0.993;
          decayMin = 0.009; decayMax = 0.015; trailLen = 11; hueJitter = 6;
          break;
        case 'chrysanthemum':
          n = 110; speedMin = 2.8; speedMax = 7.6 * scale; gravity = 0.05 * scale; drag = 0.981;
          decayMin = 0.013; decayMax = 0.021; trailLen = 6; hueJitter = 14;
          break;
        case 'crackle':
          n = 50; speedMin = 3.4; speedMax = 6.6 * scale; gravity = 0.058 * scale; drag = 0.978;
          decayMin = 0.017; decayMax = 0.026; trailLen = 3; hueJitter = 18;
          break;
        default: // peony
          n = 70; speedMin = 3.1; speedMax = 6.8 * scale; gravity = 0.058 * scale; drag = 0.982;
          decayMin = 0.015; decayMax = 0.023; trailLen = 4; hueJitter = 10;
      }

      const densityScale = Math.max(0.55, Math.min(1, state.W / 900));
      n = Math.round(n * densityScale);

      for (let i = 0; i < n; i++) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(speedMin, speedMax);
        const particleHue = type === 'willow' ? rand(38, 48) : hue + rand(-hueJitter, hueJitter);
        state.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity, drag,
          hue: particleHue,
          sat: type === 'willow' ? 65 : rand(70, 92),
          light: type === 'willow' ? rand(58, 70) : rand(55, 72),
          alpha: 1,
          decay: rand(decayMin, decayMax),
          size: (type === 'willow' ? rand(1.0, 1.7) : rand(1.3, 2.4)) * scale,
          trail: [],
          trailLen,
          crackle: type === 'crackle' && Math.random() < 0.5,
          crackleAt: (Math.random() * 24 + 14) | 0,
          age: 0,
          flicker: Math.random() < 0.25,
        });
      }
    }

    function updateAndDraw() {
      ctx.clearRect(0, 0, state.W, state.H);
      ctx.globalCompositeOperation = 'lighter';

      for (let r = state.rockets.length - 1; r >= 0; r--) {
        const rk = state.rockets[r];
        rk.trail.unshift({ x: rk.x, y: rk.y });
        if (rk.trail.length > 7) rk.trail.pop();
        rk.vy += rk.gravity;
        rk.x += rk.vx;
        rk.y += rk.vy;

        for (let t = 0; t < rk.trail.length; t++) {
          const pt = rk.trail[t];
          const ta = (1 - t / rk.trail.length) * 0.65;
          ctx.fillStyle = `hsla(${rk.hue}, 85%, 75%, ${ta})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(rk.x, rk.y, 1.7, 0, Math.PI * 2);
        ctx.fill();

        if (rk.vy >= -0.4 || rk.y <= rk.targetY) {
          explode(rk.x, rk.y, rk.hue, rk.type);
          state.rockets.splice(r, 1);
        }
      }

      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.age++;
        p.trail.unshift({ x: p.x, y: p.y });
        if (p.trail.length > p.trailLen) p.trail.pop();

        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.crackle && p.age === p.crackleAt && p.alpha > 0.25) {
          p.crackle = false;
          const burstCount = 4 + ((Math.random() * 3) | 0);
          for (let k = 0; k < burstCount; k++) {
            const a2 = rand(0, Math.PI * 2);
            const sp2 = rand(1, 3);
            state.particles.push({
              x: p.x, y: p.y,
              vx: Math.cos(a2) * sp2, vy: Math.sin(a2) * sp2,
              gravity: 0.05, drag: 0.98,
              hue: p.hue, sat: 88, light: 78,
              alpha: 1, decay: rand(0.03, 0.045),
              size: rand(0.8, 1.4),
              trail: [], trailLen: 2,
              crackle: false, crackleAt: 0, age: 0, flicker: false,
            });
          }
        }

        if (p.alpha <= 0) { state.particles.splice(i, 1); continue; }

        const flickerA = p.flicker ? 0.5 + 0.5 * Math.sin(p.age * 0.9) : 1;
        const alpha = Math.max(0, p.alpha) * flickerA;

        for (let t = p.trail.length - 1; t >= 0; t--) {
          const tp = p.trail[t];
          const ta = alpha * (1 - t / p.trailLen) * 0.5;
          ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${ta})`;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light + 15}%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';

      if (state.rockets.length || state.particles.length) {
        requestAnimationFrame(updateAndDraw);
      } else {
        state.running = false;
      }
    }

    function fire() {
      const mobile = window.innerWidth < 768;
      const bursts = mobile ? 5 : 7;
      const spreadMs = 1750;
      const stepMs = spreadMs / (bursts - 1);
      const zoneMargin = mobile ? 0.16 : 0.06; // keep launches further from the edges on narrow screens
      const zoneSpan = 1 - zoneMargin * 2;

      const usedTypes = [];
      while (usedTypes.length < bursts) {
        usedTypes.push(...TYPES.slice().sort(() => Math.random() - 0.5));
      }
      // evenly spaced zones across the bottom, shuffled so launch order isn't strictly left-to-right
      const zones = [];
      for (let z = 0; z < bursts; z++) zones.push(zoneMargin + (z / (bursts - 1)) * zoneSpan);
      zones.sort(() => Math.random() - 0.5);

      // evenly spaced apex heights, shuffled independently of x so bursts land
      // at varied heights instead of all popping in the same band.
      const heightTop = mobile ? 0.2 : 0.22;
      const heightBottom = mobile ? 0.72 : 0.62;
      const heights = [];
      for (let h = 0; h < bursts; h++) heights.push(heightTop + (h / (bursts - 1)) * (heightBottom - heightTop));
      heights.sort(() => Math.random() - 0.5);

      for (let b = 0; b < bursts; b++) {
        const timerId = window.setTimeout(() => {
          const hue = HUE_FAMILIES[(Math.random() * HUE_FAMILIES.length) | 0];
          const x0 = state.W * zones[b] + rand(-state.W * 0.02, state.W * 0.02);
          const tx = x0 + rand(-state.W * 0.05, state.W * 0.05);
          const ty = state.H * heights[b] + rand(-state.H * 0.02, state.H * 0.02);
          spawnRocket(x0, tx, ty, hue, usedTypes[b]);
          if (!state.running) {
            state.running = true;
            requestAnimationFrame(updateAndDraw);
          }
        }, b * stepMs);
        state.pendingTimers.push(timerId);
      }
    }

    fireRef.current = fire;

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      stopAll();
    };
  }, []);

  useEffect(() => {
    if (!trigger) return; // skip the initial mount value (0/undefined)
    fireRef.current();
  }, [trigger]);

  return <canvas ref={canvasRef} className="fireworks-canvas" aria-hidden="true" />;
}
