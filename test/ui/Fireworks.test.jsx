import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Fireworks from '../../src/client/components/Fireworks.jsx';

// jsdom has no 2D canvas backend (would need the optional `canvas` package),
// so canvas.getContext('2d') returns undefined here — these tests exercise
// that the component mounts/updates/unmounts cleanly under that constraint,
// same as it would gracefully no-op on any environment lacking 2D canvas.
describe('Fireworks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a canvas element', () => {
    const { container } = render(<Fireworks trigger={0} />);
    expect(container.querySelector('canvas.fireworks-canvas')).toBeInTheDocument();
  });

  it('does not throw when trigger changes from its initial value', () => {
    const { rerender } = render(<Fireworks trigger={0} />);
    expect(() => rerender(<Fireworks trigger={1} />)).not.toThrow();
  });

  it('does not fire on mount (trigger starts at 0)', () => {
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    render(<Fireworks trigger={0} />);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('does not throw on unmount after firing', () => {
    const { rerender, unmount } = render(<Fireworks trigger={0} />);
    rerender(<Fireworks trigger={1} />);
    expect(() => unmount()).not.toThrow();
  });
});
