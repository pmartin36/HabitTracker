import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import HabitBoard from '../../src/client/components/HabitBoard.jsx';

// Today in YYYY-MM-DD using local time, matching todayString() in the component
const _d = new Date();
const today = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`;

const SAMPLE_HABITS = [
  { id: 1, name: 'Exercise', emoji: '🏃', sort_order: 1 },
  { id: 2, name: 'Read',     emoji: '📚', sort_order: 2 },
  { id: 3, name: 'Meditate', emoji: '🧘', sort_order: 3 },
];

const FIVE_HABITS = [
  { id: 1, name: 'Exercise',  emoji: '🏃', sort_order: 1 },
  { id: 2, name: 'Read',      emoji: '📚', sort_order: 2 },
  { id: 3, name: 'Meditate',  emoji: '🧘', sort_order: 3 },
  { id: 4, name: 'Journal',   emoji: '✏️', sort_order: 4 },
  { id: 5, name: 'Hydrate',   emoji: '💧', sort_order: 5 },
];

function renderBoard({
  habits = SAMPLE_HABITS,
  entries = [],
  onStatusChange = vi.fn(),
  onAddHabit = vi.fn(),
} = {}) {
  return render(
    <HabitBoard
      habits={habits}
      entries={entries}
      onStatusChange={onStatusChange}
      onAddHabit={onAddHabit}
    />
  );
}

describe('HabitBoard', () => {
  it('renders one card per habit', () => {
    renderBoard();
    // Each habit has a visible name on a card
    expect(screen.getByText('Exercise')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('Meditate')).toBeInTheDocument();
  });

  it('renders the habit name on each card', () => {
    renderBoard({ habits: [{ id: 1, name: 'Yoga', emoji: '🧘', sort_order: 1 }] });
    expect(screen.getByText('Yoga')).toBeInTheDocument();
  });

  it('each card has a Done! button', () => {
    renderBoard({ habits: SAMPLE_HABITS });
    const doneButtons = screen.getAllByRole('button', { name: /done!/i });
    expect(doneButtons).toHaveLength(SAMPLE_HABITS.length);
  });

  it('each card has a Skip button', () => {
    renderBoard({ habits: SAMPLE_HABITS });
    const skipButtons = screen.getAllByRole('button', { name: /skip/i });
    expect(skipButtons).toHaveLength(SAMPLE_HABITS.length);
  });

  it('each card has a Fail button', () => {
    renderBoard({ habits: SAMPLE_HABITS });
    const failButtons = screen.getAllByRole('button', { name: /fail/i });
    expect(failButtons).toHaveLength(SAMPLE_HABITS.length);
  });

  it('clicking "Done!" on a habit card calls onStatusChange with that habit id, today, and pass', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    renderBoard({
      habits: [{ id: 42, name: 'Exercise', emoji: '🏃', sort_order: 1 }],
      onStatusChange,
    });
    await user.click(screen.getByRole('button', { name: /done!/i }));
    expect(onStatusChange).toHaveBeenCalledWith(42, today, 'pass');
  });

  it('clicking "Skip" on a habit card calls onStatusChange with that habit id, today, and skip', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    renderBoard({
      habits: [{ id: 42, name: 'Exercise', emoji: '🏃', sort_order: 1 }],
      onStatusChange,
    });
    await user.click(screen.getByRole('button', { name: /skip/i }));
    expect(onStatusChange).toHaveBeenCalledWith(42, today, 'skip');
  });

  it('clicking "Fail" on a habit card calls onStatusChange with that habit id, today, and fail', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    renderBoard({
      habits: [{ id: 42, name: 'Exercise', emoji: '🏃', sort_order: 1 }],
      onStatusChange,
    });
    await user.click(screen.getByRole('button', { name: /fail/i }));
    expect(onStatusChange).toHaveBeenCalledWith(42, today, 'fail');
  });

  it('clicking "Done!" calls onStatusChange for the correct habit when multiple habits exist', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    renderBoard({ habits: SAMPLE_HABITS, onStatusChange });

    // Find the card for "Read" (id: 2) and click its Done! button
    const readCard = screen.getByText('Read').closest('[data-testid^="habit-card"]') ||
                     screen.getByText('Read').closest('article, section, li, div[class*="card"]');
    const doneBtn = within(readCard).getByRole('button', { name: /done!/i });
    await user.click(doneBtn);
    expect(onStatusChange).toHaveBeenCalledWith(2, today, 'pass');
  });

  it('"+" button is visible when fewer than 5 habits exist', () => {
    renderBoard({ habits: SAMPLE_HABITS }); // 3 habits
    expect(screen.getByRole('button', { name: /\+/ })).toBeInTheDocument();
  });

  it('"+" button is NOT rendered when exactly 5 habits exist', () => {
    renderBoard({ habits: FIVE_HABITS });
    expect(screen.queryByRole('button', { name: /\+/ })).not.toBeInTheDocument();
  });

  it('clicking the "+" button calls onAddHabit', async () => {
    const user = userEvent.setup();
    const onAddHabit = vi.fn();
    renderBoard({ habits: SAMPLE_HABITS, onAddHabit });
    await user.click(screen.getByRole('button', { name: /\+/ }));
    expect(onAddHabit).toHaveBeenCalledTimes(1);
  });

  it('with 0 habits renders an empty board that still shows the "+" button', () => {
    renderBoard({ habits: [] });
    expect(screen.getByRole('button', { name: /\+/ })).toBeInTheDocument();
    // No habit names should be present
    expect(screen.queryByText('Exercise')).not.toBeInTheDocument();
  });
});
