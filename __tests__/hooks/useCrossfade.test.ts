import { act, renderHook } from '@testing-library/react';
import { useCrossfade } from '../../src/hooks/useCrossfade';

describe('useCrossfade Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('initializes with Track A active and Track B muted', () => {
    const { result } = renderHook(() =>
      useCrossfade({
        hasTrackA: true,
        hasTrackB: true,
        crossfadeTime: 2.5,
        crossfadeCurve: 'equal-power',
        updateRate: 60,
      })
    );

    expect(result.current.activeTrack).toBe('A');
    expect(result.current.volumeA).toBe(1);
    expect(result.current.volumeB).toBe(0);
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.crossfadeDirection).toBeNull();
  });

  it('switches directly to Track B without a transition', () => {
    const { result } = renderHook(() =>
      useCrossfade({
        hasTrackA: true,
        hasTrackB: true,
        crossfadeTime: 2.5,
        crossfadeCurve: 'equal-power',
        updateRate: 60,
      })
    );

    act(() => {
      result.current.handleTrackSwitch('B');
    });

    expect(result.current.activeTrack).toBe('B');
    expect(result.current.volumeA).toBe(0);
    expect(result.current.volumeB).toBe(1);
    expect(result.current.isTransitioning).toBe(false);
  });

  it('crossfades from Track A to Track B when switching to both', () => {
    const { result } = renderHook(() =>
      useCrossfade({
        hasTrackA: true,
        hasTrackB: true,
        crossfadeTime: 2,
        crossfadeCurve: 'equal-power',
        updateRate: 60,
      })
    );

    act(() => {
      result.current.handleTrackSwitch('both');
    });

    expect(result.current.isTransitioning).toBe(true);
    expect(result.current.crossfadeDirection).toBe('A->B');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.volumeA).toBeGreaterThan(0);
    expect(result.current.volumeA).toBeLessThan(1);
    expect(result.current.volumeB).toBeGreaterThan(0);
    expect(result.current.volumeB).toBeLessThan(1);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.crossfadeDirection).toBeNull();
    expect(result.current.activeTrack).toBe('B');
    expect(result.current.volumeA).toBe(0);
    expect(result.current.volumeB).toBe(1);
  });

  it('resets to the available track when one deck becomes unavailable', () => {
    const { result, rerender } = renderHook(
      ({ hasTrackA, hasTrackB }) =>
        useCrossfade({
          hasTrackA,
          hasTrackB,
          crossfadeTime: 2.5,
          crossfadeCurve: 'equal-power',
          updateRate: 60,
        }),
      {
        initialProps: { hasTrackA: true, hasTrackB: true },
      }
    );

    act(() => {
      result.current.handleTrackSwitch('B');
    });

    expect(result.current.activeTrack).toBe('B');

    rerender({ hasTrackA: false, hasTrackB: true });

    expect(result.current.activeTrack).toBe('B');
    expect(result.current.volumeA).toBe(0);
    expect(result.current.volumeB).toBe(1);

    rerender({ hasTrackA: false, hasTrackB: false });

    expect(result.current.activeTrack).toBe('A');
    expect(result.current.volumeA).toBe(1);
    expect(result.current.volumeB).toBe(0);
    expect(result.current.isTransitioning).toBe(false);
  });
});
