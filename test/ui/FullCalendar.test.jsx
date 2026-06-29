import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import FullCalendar from '../../src/client/components/FullCalendar.jsx';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function renderCalendar({
  habitId = 1,
  entries = [],
  onStatusChange = vi.fn(),
  initialYear = 2024,
  initialMonth = 1,
} = {}) {
  return render(
    <FullCalendar
      habitId={habitId}
      entries={entries}
      onStatusChange={onStatusChange}
      initialYear={initialYear}
      initialMonth={initialMonth}
    />
  );
}

describe('FullCalendar', () => {
  it('renders the month and year as a heading', () => {
    renderCalendar({ initialYear: 2024, initialMonth: 1 });
    expect(screen.getByText(/January\s+2024/)).toBeInTheDocument();
  });

  it('renders a "Previous" navigation button', () => {
    renderCalendar();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
  });

  it('renders a "Next" navigation button', () => {
    renderCalendar();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('clicking "Next" advances the heading to the next month', async () => {
    const user = userEvent.setup();
    renderCalendar({ initialYear: 2024, initialMonth: 1 });
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/February\s+2024/)).toBeInTheDocument();
  });

  it('clicking "Previous" moves the heading back one month', async () => {
    const user = userEvent.setup();
    renderCalendar({ initialYear: 2024, initialMonth: 3 });
    await user.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByText(/February\s+2024/)).toBeInTheDocument();
  });

  it('navigating forward across a year boundary wraps to January of the next year', async () => {
    const user = userEvent.setup();
    renderCalendar({ initialYear: 2024, initialMonth: 12 });
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/January\s+2025/)).toBeInTheDocument();
  });

  it('navigating backward across a year boundary wraps to December of the previous year', async () => {
    const user = userEvent.setup();
    renderCalendar({ initialYear: 2024, initialMonth: 1 });
    await user.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByText(/December\s+2023/)).toBeInTheDocument();
  });

  it('multiple consecutive "Next" clicks advance through months correctly', async () => {
    const user = userEvent.setup();
    renderCalendar({ initialYear: 2024, initialMonth: 10 });
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/November\s+2024/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/December\s+2024/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/January\s+2025/)).toBeInTheDocument();
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

  it('day cells on the new month are visible after navigation', async () => {
    const user = userEvent.setup();
    renderCalendar({ initialYear: 2024, initialMonth: 1 });
    await user.click(screen.getByRole('button', { name: /next/i }));
    // February 2024 day cells should now be present
    expect(screen.getByTestId('day-2024-02-01')).toBeInTheDocument();
  });

  it('day cells from the previous month are no longer present after navigation', async () => {
    const user = userEvent.setup();
    renderCalendar({ initialYear: 2024, initialMonth: 1 });
    await user.click(screen.getByRole('button', { name: /next/i }));
    // January cells should be gone (or outside-class)
    const jan31 = screen.queryByTestId('day-2024-01-31');
    if (jan31 !== null) {
      expect(jan31).toHaveClass('day-outside');
    }
  });
});
