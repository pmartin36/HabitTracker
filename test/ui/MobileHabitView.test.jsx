import { render, screen, within } from '@testing-library/react';
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

function renderView({
  habits = HABITS,
  entries = [],
  onStatusChange = vi.fn(),
} = {}) {
  return render(
    <MobileHabitView
      habits={habits}
      entries={entries}
      onStatusChange={onStatusChange}
    />
  );
}

describe('MobileHabitView', () => {
  it('renders exactly one habit card at a time (the first habit by default)', () => {
    renderView();
    // Only the first habit is visible
    expect(screen.getByText('Exercise')).toBeInTheDocument();
    expect(screen.queryByText('Read')).not.toBeInTheDocument();
    expect(screen.queryByText('Meditate')).not.toBeInTheDocument();
  });

  it('shows dot indicators equal to the number of habits', () => {
    renderView();
    const dots = screen.getAllByTestId(/^indicator-dot-/);
    expect(dots).toHaveLength(HABITS.length);
  });

  it('the first dot is marked active when on the first habit', () => {
    renderView();
    const firstDot = screen.getByTestId('indicator-dot-0');
    expect(firstDot).toHaveClass('active');
  });

  it('dots for non-active habits are not marked active', () => {
    renderView();
    expect(screen.getByTestId('indicator-dot-1')).not.toHaveClass('active');
    expect(screen.getByTestId('indicator-dot-2')).not.toHaveClass('active');
  });

  it('renders a "Next" navigation button', () => {
    renderView();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('renders a "Previous" navigation button', () => {
    renderView();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
  });

  it('"Previous" is disabled or hidden on the first habit', () => {
    renderView();
    const prevBtn = screen.getByRole('button', { name: /previous/i });
    // Acceptable: disabled attribute, aria-disabled, or not visible
    const isDisabled = prevBtn.disabled || prevBtn.getAttribute('aria-disabled') === 'true';
    expect(isDisabled).toBe(true);
  });

  it('"Next" is disabled or hidden on the last habit', async () => {
    const user = userEvent.setup();
    renderView();
    // Navigate to last habit
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    const nextBtn = screen.getByRole('button', { name: /next/i });
    const isDisabled = nextBtn.disabled || nextBtn.getAttribute('aria-disabled') === 'true';
    expect(isDisabled).toBe(true);
  });

  it('clicking "Next" shows the next habit', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.queryByText('Exercise')).not.toBeInTheDocument();
  });

  it('clicking "Previous" shows the previous habit', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByText('Exercise')).toBeInTheDocument();
    expect(screen.queryByText('Read')).not.toBeInTheDocument();
  });

  it('the active dot index updates when navigating forward', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByTestId('indicator-dot-1')).toHaveClass('active');
    expect(screen.getByTestId('indicator-dot-0')).not.toHaveClass('active');
  });

  it('the active dot index updates when navigating backward', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByTestId('indicator-dot-1')).toHaveClass('active');
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

  it('action buttons call onStatusChange for the correct habit after navigation', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    renderView({ onStatusChange });
    await user.click(screen.getByRole('button', { name: /next/i }));
    // Now on habit id: 2 ("Read")
    await user.click(screen.getByRole('button', { name: /done!/i }));
    expect(onStatusChange).toHaveBeenCalledWith(2, today, 'pass');
  });

  it('renders with a single habit without crashing, with navigation buttons disabled', () => {
    renderView({ habits: [{ id: 1, name: 'Solo', emoji: '⭐', sort_order: 1 }] });
    expect(screen.getByText('Solo')).toBeInTheDocument();
    const prevBtn = screen.getByRole('button', { name: /previous/i });
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(prevBtn.disabled || prevBtn.getAttribute('aria-disabled') === 'true').toBe(true);
    expect(nextBtn.disabled || nextBtn.getAttribute('aria-disabled') === 'true').toBe(true);
  });
});
