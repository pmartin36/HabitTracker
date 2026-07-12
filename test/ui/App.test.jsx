import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../../src/client/App.jsx';

const today = new Date().toISOString().split('T')[0];

const SAMPLE_HABITS = [
  { id: 1, name: 'Exercise', emoji: '🏃', sort_order: 1 },
];

// ── Component mocks ──────────────────────────────────────────────────────────
// HabitBoard mock renders a card per habit, with Done!/Skip/Fail buttons and a
// mini-calendar placeholder so App-level orchestration can be tested.
vi.mock('../../src/client/components/HabitBoard.jsx', () => ({
  default: ({ habits = [], onStatusChange }) => (
    <div data-testid="habit-board">
      {habits.map((h) => (
        <div key={h.id} data-testid={`habit-card-${h.id}`}>
          <span>{h.name}</span>
          <div data-testid={`mini-calendar-${h.id}`} />
          <button data-testid={`done-${h.id}`} onClick={() => onStatusChange(h.id, today, 'pass')}>Done!</button>
          <button data-testid={`skip-${h.id}`} onClick={() => onStatusChange(h.id, today, 'skip')}>Skip</button>
          <button data-testid={`fail-${h.id}`} onClick={() => onStatusChange(h.id, today, 'fail')}>Fail</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../src/client/components/MobileHabitView.jsx', () => ({
  default: ({ habits = [] }) => (
    <div data-testid="mobile-habit-view">
      {habits.map((h) => (
        <div key={h.id} data-testid={`mobile-habit-card-${h.id}`}>
          <span>{h.name}</span>
          <div data-testid={`mini-calendar-${h.id}`} />
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../src/client/components/MoodStrip.jsx', () => ({
  default: ({ onRatingChange, showCalendarButton, showingCalendar, onToggleCalendar }) => (
    <div data-testid="mood-strip">
      <button
        data-testid="mood-icon-3"
        onClick={() => onRatingChange && onRatingChange(3)}
      >
        😐
      </button>
      {showCalendarButton && (
        <button onClick={onToggleCalendar}>
          {showingCalendar ? 'Hide Mood Calendar' : 'Mood Calendar'}
        </button>
      )}
    </div>
  ),
}));

vi.mock('../../src/client/components/MoodCalendar.jsx', () => ({
  default: () => <div data-testid="mood-calendar" />,
}));

// ── Fetch mock factory ───────────────────────────────────────────────────────
// Returns appropriate shaped responses for each endpoint.
// POST calls always succeed. GET calls return the supplied fixtures.
function makeFetchMock({ habits = SAMPLE_HABITS, entries = [], mood = [] } = {}) {
  return vi.fn((url, options = {}) => {
    const method = options.method ?? 'GET';
    if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    if (url.includes('/api/habits')) {
      return Promise.resolve({ ok: true, json: async () => habits });
    }
    if (url.includes('/api/entries')) {
      return Promise.resolve({ ok: true, json: async () => entries });
    }
    if (url.includes('/api/mood')) {
      return Promise.resolve({ ok: true, json: async () => mood });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

// Unlike makeFetchMock, this tracks entries statefully across POST/DELETE/GET
// calls — needed to test fireworks-trigger logic, which reads back the fresh
// entries returned after a status change.
function makeStatefulFetchMock({ habits = SAMPLE_HABITS } = {}) {
  let entries = [];
  return vi.fn((url, options = {}) => {
    const method = options.method ?? 'GET';
    if (url.includes('/api/entries')) {
      if (method === 'POST') {
        const body = JSON.parse(options.body);
        entries = entries.filter((e) => !(e.habit_id === body.habit_id && e.date === body.date));
        entries.push({ habit_id: body.habit_id, date: body.date, status: body.status });
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (method === 'DELETE') {
        const body = JSON.parse(options.body);
        entries = entries.filter((e) => !(e.habit_id === body.habit_id && e.date === body.date));
        return Promise.resolve({ ok: true, json: async () => ({ deleted: true }) });
      }
      return Promise.resolve({ ok: true, json: async () => entries });
    }
    if (url.includes('/api/habits')) {
      return Promise.resolve({ ok: true, json: async () => habits });
    }
    if (url.includes('/api/mood')) {
      return Promise.resolve({ ok: true, json: async () => [] });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

// ── Test suite ───────────────────────────────────────────────────────────────
describe('App', () => {
  beforeEach(() => {
    // Default viewport: desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    global.fetch = makeFetchMock();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Smoke test ───────────────────────────────────────────────────────────

  it('renders without crashing with empty habits, entries, and mood', async () => {
    global.fetch = makeFetchMock({ habits: [], entries: [], mood: [] });
    render(<App />);
    // Wait for at least one fetch so we know mount effects ran
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  // ── Data fetching on mount ───────────────────────────────────────────────

  it('fetches /api/habits on mount', async () => {
    render(<App />);
    await waitFor(() => {
      const calls = global.fetch.mock.calls.filter(([url]) =>
        url.includes('/api/habits')
      );
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  it("fetches /api/entries for today's month on mount", async () => {
    render(<App />);
    await waitFor(() => {
      const calls = global.fetch.mock.calls.filter(([url]) =>
        url.includes('/api/entries')
      );
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  it('fetches /api/mood on mount', async () => {
    render(<App />);
    await waitFor(() => {
      const calls = global.fetch.mock.calls.filter(([url]) =>
        url.includes('/api/mood')
      );
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  // ── Re-fetch on tab focus ────────────────────────────────────────────────

  it('re-fetches habits/entries/mood/streaks when the tab becomes visible again', async () => {
    render(<App />);
    await waitFor(() => {
      expect(global.fetch.mock.calls.some(([url]) => url.includes('/api/habits'))).toBe(true);
    });

    const countBefore = global.fetch.mock.calls.length;

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));

    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => {
      expect(global.fetch.mock.calls.length).toBeGreaterThan(countBefore);
    });
  });

  it('renders newly-fetched data after the tab becomes visible again (not just fetches it)', async () => {
    // A mock whose /api/habits response can change between calls, so we can
    // prove the DOM actually reflects the second response — not just that a
    // second fetch happened.
    let habitsData = SAMPLE_HABITS;
    global.fetch = vi.fn((url, options = {}) => {
      const method = options.method ?? 'GET';
      if (method !== 'GET') return Promise.resolve({ ok: true, json: async () => ({}) });
      if (url.includes('/api/habits')) return Promise.resolve({ ok: true, json: async () => habitsData });
      if (url.includes('/api/entries')) return Promise.resolve({ ok: true, json: async () => [] });
      if (url.includes('/api/mood')) return Promise.resolve({ ok: true, json: async () => [] });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<App />);
    await waitFor(() => expect(screen.getByText('Exercise')).toBeInTheDocument());
    expect(screen.queryByText('Meditate')).not.toBeInTheDocument();

    // Simulate a habit added from another device/tab while this one was backgrounded.
    habitsData = [...SAMPLE_HABITS, { id: 99, name: 'Meditate', emoji: '🧘', sort_order: 2 }];

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(screen.getByText('Meditate')).toBeInTheDocument());
  });

  it('does not re-fetch just because the tab becomes hidden', async () => {
    render(<App />);
    await waitFor(() => {
      expect(global.fetch.mock.calls.some(([url]) => url.includes('/api/habits'))).toBe(true);
    });

    const countBefore = global.fetch.mock.calls.length;

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));

    // Give any (incorrect) fetch a moment to fire before asserting it didn't.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(global.fetch.mock.calls.length).toBe(countBefore);
  });

  // ── Desktop / mobile layout ──────────────────────────────────────────────

  it('renders HabitBoard when window.innerWidth >= 768', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('habit-board')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('mobile-habit-view')).not.toBeInTheDocument();
  });

  it('renders MobileHabitView when window.innerWidth < 768', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('mobile-habit-view')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('habit-board')).not.toBeInTheDocument();
  });

  // ── MoodStrip ────────────────────────────────────────────────────────────

  it('renders MoodStrip', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('mood-strip')).toBeInTheDocument();
    });
  });

  // ── Mood Calendar toggle ─────────────────────────────────────────────────

  it('"Mood Calendar" button is always visible', async () => {
    global.fetch = makeFetchMock({ mood: [] });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('mood-strip')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /mood calendar/i })
    ).toBeInTheDocument();
  });

  it('"Mood Calendar" button IS visible after a mood rating is fetched', async () => {
    global.fetch = makeFetchMock({ mood: [{ date: today, rating: 3 }] });
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mood calendar/i })
      ).toBeInTheDocument();
    });
  });

  // ── Check-in (Done!) ─────────────────────────────────────────────────────

  it('clicking Done! triggers POST /api/entries with { habit_id, date: today, status: "pass" }', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for habit card to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /done!/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /done!/i }));

    await waitFor(() => {
      const postCalls = global.fetch.mock.calls.filter(
        ([url, opts]) => url.includes('/api/entries') && opts?.method === 'POST'
      );
      expect(postCalls.length).toBeGreaterThan(0);
      const body = JSON.parse(postCalls[0][1].body);
      expect(body).toMatchObject({ habit_id: 1, date: today, status: 'pass' });
    });
  });

  it('re-fetches entries after a successful check-in', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for initial entries fetch to complete
    await waitFor(() => {
      expect(
        global.fetch.mock.calls.some(([url]) => url.includes('/api/entries'))
      ).toBe(true);
    });

    const entriesGetCountBefore = global.fetch.mock.calls.filter(
      ([url, opts]) => url.includes('/api/entries') && opts?.method !== 'POST'
    ).length;

    await user.click(screen.getByRole('button', { name: /done!/i }));

    await waitFor(() => {
      const entriesGetCountAfter = global.fetch.mock.calls.filter(
        ([url, opts]) => url.includes('/api/entries') && opts?.method !== 'POST'
      ).length;
      expect(entriesGetCountAfter).toBeGreaterThan(entriesGetCountBefore);
    });
  });

  // ── Mood change ──────────────────────────────────────────────────────────

  it('clicking a mood icon triggers POST /api/mood', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('mood-icon-3')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('mood-icon-3'));

    await waitFor(() => {
      const moodPostCalls = global.fetch.mock.calls.filter(
        ([url, opts]) => url.includes('/api/mood') && opts?.method === 'POST'
      );
      expect(moodPostCalls.length).toBeGreaterThan(0);
    });
  });

  // ── MiniCalendar ─────────────────────────────────────────────────────────

  it('MiniCalendar is rendered inside each habit card', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('mini-calendar-1')).toBeInTheDocument();
    });
  });

  // ── Fireworks trigger (once per day, only when every habit is marked pass) ──

  const FIREWORKS_KEY = 'habittracker:fireworksShownDate';
  const TWO_HABITS = [
    { id: 1, name: 'Exercise', emoji: '🏃', sort_order: 1 },
    { id: 2, name: 'Read', emoji: '📖', sort_order: 2 },
  ];

  it('does not set the fireworks flag until every habit is marked pass', async () => {
    const user = userEvent.setup();
    global.fetch = makeStatefulFetchMock({ habits: TWO_HABITS });
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('done-1')).toBeInTheDocument());
    await user.click(screen.getByTestId('done-1'));

    await waitFor(() => {
      const postCalls = global.fetch.mock.calls.filter(
        ([url, opts]) => url.includes('/api/entries') && opts?.method === 'POST'
      );
      expect(postCalls.length).toBeGreaterThan(0);
    });

    expect(window.localStorage.getItem(FIREWORKS_KEY)).toBeNull();
  });

  it('sets the fireworks flag once every habit is marked pass', async () => {
    const user = userEvent.setup();
    global.fetch = makeStatefulFetchMock({ habits: TWO_HABITS });
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('done-1')).toBeInTheDocument());
    await user.click(screen.getByTestId('done-1'));
    await user.click(screen.getByTestId('done-2'));

    await waitFor(() => {
      expect(window.localStorage.getItem(FIREWORKS_KEY)).toBe(today);
    });
  });

  it('does not set the fireworks flag when the last habit is marked skip instead of pass', async () => {
    const user = userEvent.setup();
    global.fetch = makeStatefulFetchMock({ habits: TWO_HABITS });
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('done-1')).toBeInTheDocument());
    await user.click(screen.getByTestId('done-1'));
    await user.click(screen.getByTestId('skip-2'));

    await waitFor(() => {
      const postCalls = global.fetch.mock.calls.filter(
        ([url, opts]) => url.includes('/api/entries') && opts?.method === 'POST'
      );
      expect(postCalls.length).toBeGreaterThanOrEqual(2);
    });

    expect(window.localStorage.getItem(FIREWORKS_KEY)).toBeNull();
  });

  it('only sets the fireworks flag once per day, even if Done! is clicked again', async () => {
    const user = userEvent.setup();
    global.fetch = makeStatefulFetchMock({ habits: SAMPLE_HABITS });

    // jsdom's localStorage is a host Proxy — assigning over its methods (as
    // vi.spyOn does) is silently absorbed rather than intercepted, so we swap
    // the whole window.localStorage object for a plain spy-able stub instead.
    const store = {};
    const setItemSpy = vi.fn((k, v) => { store[k] = v; });
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        setItem: setItemSpy,
        getItem: (k) => (k in store ? store[k] : null),
        removeItem: (k) => { delete store[k]; },
        clear: () => { for (const k in store) delete store[k]; },
      },
    });

    try {
      render(<App />);
      await waitFor(() => expect(screen.getByTestId('done-1')).toBeInTheDocument());

      await user.click(screen.getByTestId('done-1'));
      await waitFor(() => expect(window.localStorage.getItem(FIREWORKS_KEY)).toBe(today));
      expect(setItemSpy.mock.calls.filter(([k]) => k === FIREWORKS_KEY)).toHaveLength(1);

      await user.click(screen.getByTestId('done-1'));
      await waitFor(() => {
        const postCalls = global.fetch.mock.calls.filter(
          ([url, opts]) => url.includes('/api/entries') && opts?.method === 'POST'
        );
        expect(postCalls.length).toBeGreaterThanOrEqual(2);
      });
      expect(setItemSpy.mock.calls.filter(([k]) => k === FIREWORKS_KEY)).toHaveLength(1);
    } finally {
      Object.defineProperty(window, 'localStorage', originalDescriptor);
    }
  });
});
