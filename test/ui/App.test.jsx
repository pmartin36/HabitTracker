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
// HabitBoard mock renders a card per habit, with a Done! button and a
// mini-calendar placeholder so App-level orchestration can be tested.
vi.mock('../../src/client/components/HabitBoard.jsx', () => ({
  default: ({ habits = [], onStatusChange }) => (
    <div data-testid="habit-board">
      {habits.map((h) => (
        <div key={h.id} data-testid={`habit-card-${h.id}`}>
          <span>{h.name}</span>
          <div data-testid={`mini-calendar-${h.id}`} />
          <button onClick={() => onStatusChange(h.id, today, 'pass')}>Done!</button>
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
  default: ({ onRatingChange }) => (
    <div data-testid="mood-strip">
      <button
        data-testid="mood-icon-3"
        onClick={() => onRatingChange && onRatingChange(3)}
      >
        😐
      </button>
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
    if (options.method === 'POST') {
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

  it('"Mood Calendar" button is NOT visible when no mood is set', async () => {
    global.fetch = makeFetchMock({ mood: [] });
    render(<App />);
    // Wait for component to finish loading (mood-strip signals the render settled)
    await waitFor(() => {
      expect(screen.getByTestId('mood-strip')).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', { name: /mood calendar/i })
    ).not.toBeInTheDocument();
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
});
