import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import MiniCalendar from '../../src/client/components/MiniCalendar.jsx';

// January 2024: 31 days, starts on Monday
const YEAR = 2024;
const MONTH = 1;

function renderCalendar({ entries = [], onStatusChange = vi.fn() } = {}) {
  return render(
    <MiniCalendar
      habitId={1}
      entries={entries}
      onStatusChange={onStatusChange}
      year={YEAR}
      month={MONTH}
    />
  );
}

describe('MiniCalendar', () => {
  it('renders a grid of day cells for the given month', () => {
    renderCalendar();
    // January 2024 has 31 days — expect 31 cells with data-testid day-2024-01-XX
    const dayCells = screen.getAllByTestId(/^day-2024-01-\d{2}$/);
    const inMonthCells = dayCells.filter(el => !el.classList.contains('day-outside'));
    expect(inMonthCells).toHaveLength(31);
  });

  it('each day cell has a data-testid of day-YYYY-MM-DD', () => {
    renderCalendar();
    expect(screen.getByTestId('day-2024-01-01')).toBeInTheDocument();
    expect(screen.getByTestId('day-2024-01-15')).toBeInTheDocument();
    expect(screen.getByTestId('day-2024-01-31')).toBeInTheDocument();
  });

  it('a pass day has CSS class status-pass', () => {
    const entries = [{ date: '2024-01-05', status: 'pass' }];
    renderCalendar({ entries });
    expect(screen.getByTestId('day-2024-01-05')).toHaveClass('status-pass');
  });

  it('a fail day has CSS class status-fail', () => {
    const entries = [{ date: '2024-01-10', status: 'fail' }];
    renderCalendar({ entries });
    expect(screen.getByTestId('day-2024-01-10')).toHaveClass('status-fail');
  });

  it('a skip day has CSS class status-skip', () => {
    const entries = [{ date: '2024-01-15', status: 'skip' }];
    renderCalendar({ entries });
    expect(screen.getByTestId('day-2024-01-15')).toHaveClass('status-skip');
  });

  it('a pending day has CSS class status-pending', () => {
    const entries = [{ date: '2024-01-20', status: 'pending' }];
    renderCalendar({ entries });
    expect(screen.getByTestId('day-2024-01-20')).toHaveClass('status-pending');
  });

  it('a day with no entry defaults to CSS class status-pending', () => {
    renderCalendar({ entries: [] });
    expect(screen.getByTestId('day-2024-01-07')).toHaveClass('status-pending');
  });

  it('clicking a pass day calls onStatusChange with the next cycle status (skip)', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    const entries = [{ date: '2024-01-05', status: 'pass' }];
    renderCalendar({ entries, onStatusChange });
    await user.click(screen.getByTestId('day-2024-01-05'));
    expect(onStatusChange).toHaveBeenCalledWith('2024-01-05', 'skip');
  });

  it('clicking a skip day calls onStatusChange with the next cycle status (fail)', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    const entries = [{ date: '2024-01-15', status: 'skip' }];
    renderCalendar({ entries, onStatusChange });
    await user.click(screen.getByTestId('day-2024-01-15'));
    expect(onStatusChange).toHaveBeenCalledWith('2024-01-15', 'fail');
  });

  it('clicking a fail day calls onStatusChange with the next cycle status (pending)', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    const entries = [{ date: '2024-01-10', status: 'fail' }];
    renderCalendar({ entries, onStatusChange });
    await user.click(screen.getByTestId('day-2024-01-10'));
    expect(onStatusChange).toHaveBeenCalledWith('2024-01-10', 'pending');
  });

  it('clicking a pending day calls onStatusChange with the next cycle status (pass)', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    const entries = [{ date: '2024-01-20', status: 'pending' }];
    renderCalendar({ entries, onStatusChange });
    await user.click(screen.getByTestId('day-2024-01-20'));
    expect(onStatusChange).toHaveBeenCalledWith('2024-01-20', 'pass');
  });

  it('clicking a day with no entry (defaults to pending) cycles to pass', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    renderCalendar({ entries: [], onStatusChange });
    await user.click(screen.getByTestId('day-2024-01-07'));
    expect(onStatusChange).toHaveBeenCalledWith('2024-01-07', 'pass');
  });

  it('days outside the current month are either not rendered or have class day-outside', () => {
    renderCalendar();
    // February 1 should not appear in January, or be marked as outside
    const feb1 = screen.queryByTestId('day-2024-02-01');
    if (feb1 !== null) {
      expect(feb1).toHaveClass('day-outside');
    }
    // If null, element is simply not rendered — both behaviours are acceptable
  });

  it('renders the correct number of days for a 29-day February (leap year)', () => {
    render(
      <MiniCalendar
        habitId={1}
        entries={[]}
        onStatusChange={vi.fn()}
        year={2024}
        month={2}
      />
    );
    const dayCells = screen.getAllByTestId(/^day-2024-02-\d{2}$/);
    const inMonthCells = dayCells.filter(el => !el.classList.contains('day-outside'));
    expect(inMonthCells).toHaveLength(29);
  });

  it('renders the correct number of days for a 28-day February (non-leap year)', () => {
    render(
      <MiniCalendar
        habitId={1}
        entries={[]}
        onStatusChange={vi.fn()}
        year={2023}
        month={2}
      />
    );
    const dayCells = screen.getAllByTestId(/^day-2023-02-\d{2}$/);
    const inMonthCells = dayCells.filter(el => !el.classList.contains('day-outside'));
    expect(inMonthCells).toHaveLength(28);
  });
});
