import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import MoodStrip from '../../src/client/components/MoodStrip.jsx';

function renderStrip({
  currentRating = null,
  isEditable = true,
  onRatingChange = vi.fn(),
} = {}) {
  return render(
    <MoodStrip
      currentRating={currentRating}
      isEditable={isEditable}
      onRatingChange={onRatingChange}
    />
  );
}

describe('MoodStrip', () => {
  it('renders 5 mood icons', () => {
    renderStrip();
    const icons = screen.getAllByTestId(/^mood-icon-/);
    expect(icons).toHaveLength(5);
  });

  it('each icon has data-testid mood-icon-{1..5}', () => {
    renderStrip();
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`mood-icon-${i}`)).toBeInTheDocument();
    }
  });

  it('when currentRating=3, icon 3 has class active and others do not', () => {
    renderStrip({ currentRating: 3 });
    expect(screen.getByTestId('mood-icon-3')).toHaveClass('active');
    [1, 2, 4, 5].forEach((n) => {
      expect(screen.getByTestId(`mood-icon-${n}`)).not.toHaveClass('active');
    });
  });

  it('when currentRating=null, no icon has class active', () => {
    renderStrip({ currentRating: null });
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`mood-icon-${i}`)).not.toHaveClass('active');
    }
  });

  it('clicking an icon calls onRatingChange with its rating when isEditable=true', async () => {
    const user = userEvent.setup();
    const onRatingChange = vi.fn();
    renderStrip({ isEditable: true, onRatingChange });
    await user.click(screen.getByTestId('mood-icon-2'));
    expect(onRatingChange).toHaveBeenCalledWith(2);
  });

  it('clicking an icon does NOT call onRatingChange when isEditable=false', async () => {
    const user = userEvent.setup();
    const onRatingChange = vi.fn();
    renderStrip({ isEditable: false, onRatingChange });
    await user.click(screen.getByTestId('mood-icon-3'));
    expect(onRatingChange).not.toHaveBeenCalled();
  });

  it('when isEditable=false, icons or the strip has class locked', () => {
    const { container } = renderStrip({ isEditable: false });
    const icons = screen.getAllByTestId(/^mood-icon-/);
    const anyIconLocked = icons.some((icon) => icon.classList.contains('locked'));
    const stripLocked = container.firstChild?.classList.contains('locked');
    expect(anyIconLocked || stripLocked).toBe(true);
  });
});
