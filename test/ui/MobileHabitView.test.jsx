import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import MobileHabitView from '../../src/client/components/MobileHabitView.jsx';

const _d = new Date();
const today = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`;

const HABITS = [
  { id: 1, name: 'Exercise', emoji: '🏃', sort_order: 1 },
  { id: 2, name: 'Read',     emoji: '📚', sort_order: 2 },
  { id: 3, name: 'Meditate', emoji: '🧘', sort_order: 3 },
];

function swipeLeft(el) {
  fireEvent.touchStart(el, { touches: [{ clientX: 300 }] });
  fireEvent.touchEnd(el, { changedTouches: [{ clientX: 200 }] });
}

function swipeRight(el) {
  fireEvent.touchStart(el, { touches: [{ clientX: 200 }] });
  fireEvent.touchEnd(el, { changedTouches: [{ clientX: 300 }] });
}

function renderView({
  habits = HABITS,
  entries = [],
  onStatusChange = vi.fn(),
  onAddHabit,
} = {}) {
  return render(
    <MobileHabitView
      habits={habits}
      entries={entries}
      onStatusChange={onStatusChange}
      onAddHabit={onAddHabit}
    />
  );
}

describe('MobileHabitView', () => {
  it('renders exactly one habit card at a time (the first habit by default)', () => {
    renderView();
    expect(screen.getByText('Exercise')).toBeInTheDocument();
    expect(screen.queryByText('Read')).not.toBeInTheDocument();
    expect(screen.queryByText('Meditate')).not.toBeInTheDocument();
  });

  it('shows dot indicators equal to totalSlots (habits + add slot when < 5)', () => {
    renderView();
    const dots = screen.getAllByTestId(/^indicator-dot-/);
    // HABITS.length = 3, hasAddSlot = true (3 < 5), totalSlots = 4
    expect(dots).toHaveLength(HABITS.length + 1);
  });

  it('shows dot indicators equal to habit count when at 5 habits (no add slot)', () => {
    const fiveHabits = [
      { id: 1, name: 'A', emoji: '1️⃣', sort_order: 1 },
      { id: 2, name: 'B', emoji: '2️⃣', sort_order: 2 },
      { id: 3, name: 'C', emoji: '3️⃣', sort_order: 3 },
      { id: 4, name: 'D', emoji: '4️⃣', sort_order: 4 },
      { id: 5, name: 'E', emoji: '5️⃣', sort_order: 5 },
    ];
    renderView({ habits: fiveHabits });
    const dots = screen.getAllByTestId(/^indicator-dot-/);
    expect(dots).toHaveLength(5);
  });

  it('the first dot is marked active when on the first habit', () => {
    renderView();
    expect(screen.getByTestId('indicator-dot-0')).toHaveClass('active');
  });

  it('dots for non-active habits are not marked active', () => {
    renderView();
    expect(screen.getByTestId('indicator-dot-1')).not.toHaveClass('active');
    expect(screen.getByTestId('indicator-dot-2')).not.toHaveClass('active');
  });

  it('does not render navigation buttons', () => {
    renderView();
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
  });

  it('swiping left shows the next habit', () => {
    const { container } = renderView();
    swipeLeft(container.querySelector('.mobile-habit-view'));
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.queryByText('Exercise')).not.toBeInTheDocument();
  });

  it('swiping right shows the previous habit', () => {
    const { container } = renderView();
    const view = container.querySelector('.mobile-habit-view');
    swipeLeft(view);
    swipeRight(view);
    expect(screen.getByText('Exercise')).toBeInTheDocument();
    expect(screen.queryByText('Read')).not.toBeInTheDocument();
  });

  it('the active dot index updates when swiping forward', () => {
    const { container } = renderView();
    swipeLeft(container.querySelector('.mobile-habit-view'));
    expect(screen.getByTestId('indicator-dot-1')).toHaveClass('active');
    expect(screen.getByTestId('indicator-dot-0')).not.toHaveClass('active');
  });

  it('the active dot index updates when swiping backward', () => {
    const { container } = renderView();
    const view = container.querySelector('.mobile-habit-view');
    swipeLeft(view);
    swipeLeft(view);
    swipeRight(view);
    expect(screen.getByTestId('indicator-dot-1')).toHaveClass('active');
  });

  it('swiping left on the last habit shows the add slot', () => {
    const onAddHabit = vi.fn();
    const { container } = renderView({ onAddHabit });
    const view = container.querySelector('.mobile-habit-view');
    swipeLeft(view); // index 1
    swipeLeft(view); // index 2
    swipeLeft(view); // index 3 (add slot)
    expect(screen.getByText('Add habit')).toBeInTheDocument();
    expect(screen.queryByText('Meditate')).not.toBeInTheDocument();
  });

  it('the add-slot dot is marked active when on the add slot', () => {
    const onAddHabit = vi.fn();
    const { container } = renderView({ onAddHabit });
    const view = container.querySelector('.mobile-habit-view');
    swipeLeft(view);
    swipeLeft(view);
    swipeLeft(view); // add slot at index 3
    expect(screen.getByTestId('indicator-dot-3')).toHaveClass('active');
  });

  it('clicking the add slot card calls onAddHabit', () => {
    const onAddHabit = vi.fn();
    const { container } = renderView({ onAddHabit });
    const view = container.querySelector('.mobile-habit-view');
    swipeLeft(view);
    swipeLeft(view);
    swipeLeft(view); // add slot
    screen.getByText('Add habit').click();
    expect(onAddHabit).toHaveBeenCalled();
  });

  it('swiping left on the add slot wraps back to the first habit', () => {
    const onAddHabit = vi.fn();
    const { container } = renderView({ onAddHabit });
    const view = container.querySelector('.mobile-habit-view');
    swipeLeft(view);
    swipeLeft(view);
    swipeLeft(view); // add slot
    swipeLeft(view); // wrap to index 0
    expect(screen.getByText('Exercise')).toBeInTheDocument();
  });

  it('the visible card has a Done! button that calls onStatusChange with pass', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    renderView({ onStatusChange });
    await user.click(screen.getByRole('button', { name: /done!/i }));
    expect(onStatusChange).toHaveBeenCalledWith(1, today, 'pass');
  });

  it('the visible card has a Skip button that calls onStatusChange with skip', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    renderView({ onStatusChange });
    await user.click(screen.getByRole('button', { name: /skip/i }));
    expect(onStatusChange).toHaveBeenCalledWith(1, today, 'skip');
  });

  it('the visible card has a Fail button that calls onStatusChange with fail', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    renderView({ onStatusChange });
    await user.click(screen.getByRole('button', { name: /fail/i }));
    expect(onStatusChange).toHaveBeenCalledWith(1, today, 'fail');
  });

  it('action buttons call onStatusChange for the correct habit after swiping', () => {
    const onStatusChange = vi.fn();
    const { container } = renderView({ onStatusChange });
    swipeLeft(container.querySelector('.mobile-habit-view')); // now on habit id: 2 ("Read")
    screen.getByRole('button', { name: /done!/i }).click();
    expect(onStatusChange).toHaveBeenCalledWith(2, today, 'pass');
  });

  it('renders with a single habit without crashing', () => {
    renderView({ habits: [{ id: 1, name: 'Solo', emoji: '⭐', sort_order: 1 }] });
    expect(screen.getByText('Solo')).toBeInTheDocument();
    // 1 habit + 1 add slot = 2 dots
    expect(screen.getAllByTestId(/^indicator-dot-/)).toHaveLength(2);
  });
});
