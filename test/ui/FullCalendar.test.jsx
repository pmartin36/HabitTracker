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

  it('renders month headings for all months from createdAt to initialMonth', () => {
    renderCalendar({ initialYear: 2024, initialMonth: 3, createdAt: '2024-01-15' });
    expect(screen.getByText(/January\s+2024/)).toBeInTheDocument();
    expect(screen.getByText(/February\s+2024/)).toBeInTheDocument();
    expect(screen.getByText(/March\s+2024/)).toBeInTheDocument();
  });

  it('renders a month heading for a month in the past when createdAt is earlier', () => {
    renderCalendar({ initialYear: 2024, initialMonth: 6, createdAt: '2024-03-01' });
    expect(screen.getByText(/March\s+2024/)).toBeInTheDocument();
  });

  it('most recent month is rendered last (oldest at top, newest at bottom)', () => {
    renderCalendar({ initialYear: 2024, initialMonth: 3, createdAt: '2024-01-01' });
    const headings = screen.getAllByText(/\b(January|February|March)\s+2024/);
    expect(headings[0].textContent).toMatch(/January/);
    expect(headings[headings.length - 1].textContent).toMatch(/March/);
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

  it('entries from multiple months are shown when createdAt spans months', () => {
    const entries = [
      { date: '2024-01-05', status: 'pass' },
      { date: '2024-02-10', status: 'fail' },
    ];
    renderCalendar({ initialYear: 2024, initialMonth: 2, createdAt: '2024-01-01', entries });
    expect(screen.getByTestId('day-2024-01-05')).toHaveClass('status-pass');
    expect(screen.getByTestId('day-2024-02-10')).toHaveClass('status-fail');
  });

  it('without createdAt, renders from January of the current year', () => {
    // June 2024 → start from January 2024; Jan–June must appear, Dec 2023 must not
    renderCalendar({ initialYear: 2024, initialMonth: 6 });
    expect(screen.getByText(/June\s+2024/)).toBeInTheDocument();
    expect(screen.getByText(/January\s+2024/)).toBeInTheDocument();
    expect(screen.queryByText(/December\s+2023/)).not.toBeInTheDocument();
  });

  it('pending days default to status-pending when no entry exists', () => {
    renderCalendar({ initialYear: 2024, initialMonth: 1, entries: [] });
    // Day 15 has no entry, should be status-pending
    expect(screen.getByTestId('day-2024-01-15')).toHaveClass('status-pending');
  });
});
