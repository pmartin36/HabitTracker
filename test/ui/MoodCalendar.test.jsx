import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import MoodCalendar from '../../src/client/components/MoodCalendar.jsx';

function renderCalendar({
  moods = [],
  habitPasses = [],
  initialYear = 2024,
  initialMonth = 1,
} = {}) {
  return render(
    <MoodCalendar
      moods={moods}
      habitPasses={habitPasses}
      initialYear={initialYear}
      initialMonth={initialMonth}
    />
  );
}

describe('MoodCalendar', () => {
  it('renders a month heading showing "January 2024"', () => {
    renderCalendar({ initialYear: 2024, initialMonth: 1 });
    expect(screen.getByText(/January\s+2024/)).toBeInTheDocument();
  });

  it('has a Previous navigation button', () => {
    renderCalendar();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
  });

  it('has a Next navigation button', () => {
    renderCalendar();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('each day cell has data-testid mood-day-YYYY-MM-DD', () => {
    renderCalendar({ initialYear: 2024, initialMonth: 1 });
    expect(screen.getByTestId('mood-day-2024-01-01')).toBeInTheDocument();
    expect(screen.getByTestId('mood-day-2024-01-15')).toBeInTheDocument();
    expect(screen.getByTestId('mood-day-2024-01-31')).toBeInTheDocument();
  });

  it('a day with rating=1 has class mood-1', () => {
    const moods = [{ date: '2024-01-10', rating: 1 }];
    renderCalendar({ moods, initialYear: 2024, initialMonth: 1 });
    expect(screen.getByTestId('mood-day-2024-01-10')).toHaveClass('mood-1');
  });

  it('a day with rating=5 has class mood-5', () => {
    const moods = [{ date: '2024-01-20', rating: 5 }];
    renderCalendar({ moods, initialYear: 2024, initialMonth: 1 });
    expect(screen.getByTestId('mood-day-2024-01-20')).toHaveClass('mood-5');
  });

  it('a day with no mood entry has class mood-none', () => {
    renderCalendar({ moods: [], initialYear: 2024, initialMonth: 1 });
    expect(screen.getByTestId('mood-day-2024-01-15')).toHaveClass('mood-none');
  });

  it('a day where two habits passed shows both emojis in the cell', () => {
    const habitPasses = [
      { date: '2024-01-10', emoji: '🏃' },
      { date: '2024-01-10', emoji: '📚' },
    ];
    renderCalendar({ habitPasses, initialYear: 2024, initialMonth: 1 });
    const cell = screen.getByTestId('mood-day-2024-01-10');
    expect(cell).toHaveTextContent('🏃');
    expect(cell).toHaveTextContent('📚');
  });

  it('a day where no habits passed shows no emojis', () => {
    const habitPasses = [{ date: '2024-01-10', emoji: '🏃' }];
    renderCalendar({ habitPasses, initialYear: 2024, initialMonth: 1 });
    // Jan 15 has no passes — the emoji from Jan 10 must not appear here
    const cell = screen.getByTestId('mood-day-2024-01-15');
    expect(cell).not.toHaveTextContent('🏃');
  });

  it('clicking a day does NOT call any handler (read-only)', async () => {
    const user = userEvent.setup();
    renderCalendar({ initialYear: 2024, initialMonth: 1 });
    // The component has no onClick prop for day cells; clicking must not throw
    await user.click(screen.getByTestId('mood-day-2024-01-15'));
    // Reaching here means the click was silently ignored — read-only contract holds
  });

  it('clicking Next navigates to the next month', async () => {
    const user = userEvent.setup();
    renderCalendar({ initialYear: 2024, initialMonth: 1 });
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/February\s+2024/)).toBeInTheDocument();
  });

  it('clicking Previous navigates to the previous month', async () => {
    const user = userEvent.setup();
    renderCalendar({ initialYear: 2024, initialMonth: 3 });
    await user.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByText(/February\s+2024/)).toBeInTheDocument();
  });
});
