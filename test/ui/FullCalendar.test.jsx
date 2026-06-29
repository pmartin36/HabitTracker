import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import FullCalendar from '../../src/client/components/FullCalendar.jsx';

function renderCalendar({
  habitId = 1,
  entries = [],
  onStatusChange = vi.fn(),
  initialYear = 2024,
  initialMonth = 1,
  createdAt = undefined,
} = {}) {
  return render(
    <FullCalendar
      habitId={habitId}
      entries={entries}
      onStatusChange={onStatusChange}
      initialYear={initialYear}
      initialMonth={initialMonth}
      createdAt={createdAt}
    />
  );
}

describe('FullCalendar', () => {
  it('renders a month heading for the current month', () => {
    renderCalendar({ initialYear: 2024, initialMonth: 1 });
    expect(screen.getByText(/January\s+2024/)).toBeInTheDocument();
  });

  it('renders all 12 months of the given year (Jan–Dec)', () => {
    renderCalendar({ initialYear: 2024, initialMonth: 3 });
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    monthNames.forEach(name => {
      expect(screen.getByText(new RegExp(`${name}\\s+2024`))).toBeInTheDocument();
    });
  });

  it('renders December even when initialMonth is earlier in the year', () => {
    renderCalendar({ initialYear: 2024, initialMonth: 3 });
    expect(screen.getByText(/December\s+2024/)).toBeInTheDocument();
  });

  it('oldest month is rendered first (Jan at top, Dec at bottom)', () => {
    renderCalendar({ initialYear: 2024, initialMonth: 6 });
    const headings = screen.getAllByText(/\b(January|December)\s+2024/);
    expect(headings[0].textContent).toMatch(/January/);
    expect(headings[headings.length - 1].textContent).toMatch(/December/);
  });

  it('does not render a "Previous" navigation button', () => {
    renderCalendar();
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
  });

  it('does not render a "Next" navigation button', () => {
    renderCalendar();
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
  });

  it('day cells carry status-pass class for pass entries', () => {
    const entries = [{ date: '2024-01-10', status: 'pass' }];
    renderCalendar({ initialYear: 2024, initialMonth: 1, entries });
    expect(screen.getByTestId('day-2024-01-10')).toHaveClass('status-pass');
  });

  it('day cells carry status-fail class for fail entries', () => {
    const entries = [{ date: '2024-01-12', status: 'fail' }];
    renderCalendar({ initialYear: 2024, initialMonth: 1, entries });
    expect(screen.getByTestId('day-2024-01-12')).toHaveClass('status-fail');
  });

  it('day cells carry status-skip class for skip entries', () => {
    const entries = [{ date: '2024-01-18', status: 'skip' }];
    renderCalendar({ initialYear: 2024, initialMonth: 1, entries });
    expect(screen.getByTestId('day-2024-01-18')).toHaveClass('status-skip');
  });

  it('day cells carry status-pending class for pending entries', () => {
    const entries = [{ date: '2024-01-22', status: 'pending' }];
    renderCalendar({ initialYear: 2024, initialMonth: 1, entries });
    expect(screen.getByTestId('day-2024-01-22')).toHaveClass('status-pending');
  });

  it('clicking a day cell calls onStatusChange with the cycled status', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    const entries = [{ date: '2024-01-05', status: 'pass' }];
    renderCalendar({ initialYear: 2024, initialMonth: 1, entries, onStatusChange });
    await user.click(screen.getByTestId('day-2024-01-05'));
    expect(onStatusChange).toHaveBeenCalledWith('2024-01-05', 'skip');
  });

  it('day cells are rendered for every day in the month', () => {
    renderCalendar({ initialYear: 2024, initialMonth: 2 }); // Feb 2024 has 29 days (leap year)
    expect(screen.getByTestId('day-2024-02-01')).toBeInTheDocument();
    expect(screen.getByTestId('day-2024-02-29')).toBeInTheDocument();
  });

  it('entries from multiple months are shown', () => {
    const entries = [
      { date: '2024-01-05', status: 'pass' },
      { date: '2024-02-10', status: 'fail' },
    ];
    renderCalendar({ initialYear: 2024, initialMonth: 2, entries });
    expect(screen.getByTestId('day-2024-01-05')).toHaveClass('status-pass');
    expect(screen.getByTestId('day-2024-02-10')).toHaveClass('status-fail');
  });

  it('renders all 12 months of initialYear regardless of initialMonth', () => {
    renderCalendar({ initialYear: 2024, initialMonth: 6 });
    expect(screen.getByText(/December\s+2024/)).toBeInTheDocument();
    expect(screen.getByText(/January\s+2024/)).toBeInTheDocument();
    expect(screen.queryByText(/December\s+2023/)).not.toBeInTheDocument();
  });

  it('pending days default to status-pending when no entry exists', () => {
    renderCalendar({ initialYear: 2024, initialMonth: 1, entries: [] });
    // Day 15 has no entry, should be status-pending
    expect(screen.getByTestId('day-2024-01-15')).toHaveClass('status-pending');
  });

  it('future day cells have class "future" instead of a status class', () => {
    // 2099 is entirely in the future
    renderCalendar({ initialYear: 2099, initialMonth: 1 });
    const cell = screen.getByTestId('day-2099-01-15');
    expect(cell).toHaveClass('future');
    expect(cell).not.toHaveClass('status-pending');
  });
});
