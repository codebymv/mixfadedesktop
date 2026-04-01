import { act, renderHook } from '@testing-library/react';
import { useRecentFiles } from '../../src/hooks/useRecentFiles';
import type { RecentFile } from '../../src/types/recentFile';

const createMockFile = (name: string, size = 1024 * 1024, lastModified = 1711929600000) => {
  const file = new File(['audio'], name, { type: 'audio/wav', lastModified });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('useRecentFiles Hook', () => {
  it('adds assigned files to recents and routes them to the correct deck', () => {
    const setTrackA = jest.fn();
    const setTrackB = jest.fn();
    const fileA = createMockFile('deck-a.wav');
    const fileB = createMockFile('deck-b.wav', 2 * 1024 * 1024, 1712016000000);

    const { result } = renderHook(() =>
      useRecentFiles({
        recentFilesLimit: 5,
        setTrackA,
        setTrackB,
      })
    );

    act(() => {
      result.current.setTrackAWithRecent(fileA);
      result.current.setTrackBWithRecent(fileB);
    });

    expect(setTrackA).toHaveBeenCalledWith(fileA);
    expect(setTrackB).toHaveBeenCalledWith(fileB);
    expect(result.current.recentFiles).toHaveLength(2);
    expect(result.current.recentFiles[0].name).toBe('deck-b.wav');
    expect(result.current.recentFiles[0].lastUsedSide).toBe('B');
    expect(result.current.recentFiles[1].name).toBe('deck-a.wav');
    expect(result.current.recentFiles[1].lastUsedSide).toBe('A');
  });

  it('stages dropped files once, keeps the newest order, and preserves deck assignment', () => {
    const existingFile = createMockFile('existing.wav');
    const freshFile = createMockFile('fresh.wav', 3 * 1024 * 1024, 1712102400000);
    const duplicateExisting = createMockFile('existing.wav');

    const { result } = renderHook(() =>
      useRecentFiles({
        recentFilesLimit: 5,
        setTrackA: jest.fn(),
        setTrackB: jest.fn(),
      })
    );

    act(() => {
      result.current.setTrackAWithRecent(existingFile);
    });

    act(() => {
      result.current.stageDroppedFiles([duplicateExisting, freshFile, duplicateExisting]);
    });

    expect(result.current.recentFiles).toHaveLength(2);
    expect(result.current.recentFiles[0].name).toBe('existing.wav');
    expect(result.current.recentFiles[0].lastUsedSide).toBe('A');
    expect(result.current.recentFiles[1].name).toBe('fresh.wav');
    expect(result.current.recentFiles[1].lastUsedSide).toBeNull();
  });

  it('loads a recent file back onto its last-used deck', () => {
    const setTrackA = jest.fn();
    const setTrackB = jest.fn();
    const file = createMockFile('return.wav');

    const { result } = renderHook(() =>
      useRecentFiles({
        recentFilesLimit: 5,
        setTrackA,
        setTrackB,
      })
    );

    const recentFile: RecentFile = {
      id: 'return.wav-1',
      name: 'return.wav',
      size: '1.0 MB',
      lastModified: '4/1/2024',
      lastUsedSide: 'B',
      file,
    };

    act(() => {
      result.current.loadFileFromRecent(recentFile);
    });

    expect(setTrackB).toHaveBeenCalledWith(file);
    expect(setTrackA).not.toHaveBeenCalled();
    expect(result.current.recentFiles[0].name).toBe('return.wav');
    expect(result.current.recentFiles[0].lastUsedSide).toBe('B');
  });

  it('warns when a recent file has no saved deck assignment', () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const file = createMockFile('unassigned.wav');

    const { result } = renderHook(() =>
      useRecentFiles({
        recentFilesLimit: 5,
        setTrackA: jest.fn(),
        setTrackB: jest.fn(),
      })
    );

    act(() => {
      result.current.loadFileFromRecent({
        id: 'unassigned',
        name: 'unassigned.wav',
        size: '1.0 MB',
        lastModified: '4/1/2024',
        lastUsedSide: null,
        file,
      });
    });

    expect(consoleWarn).toHaveBeenCalledWith(
      'Recent file has no deck assignment yet:',
      'unassigned.wav'
    );

    consoleWarn.mockRestore();
  });

  it('errors when the stored recent file is missing its File object', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useRecentFiles({
        recentFilesLimit: 5,
        setTrackA: jest.fn(),
        setTrackB: jest.fn(),
      })
    );

    act(() => {
      result.current.loadFileFromRecent({
        id: 'missing-file',
        name: 'missing.wav',
        size: '1.0 MB',
        lastModified: '4/1/2024',
        lastUsedSide: 'A',
      });
    });

    expect(consoleError).toHaveBeenCalledWith(
      'File object missing from recent file - this should not happen with session-only files'
    );

    consoleError.mockRestore();
  });
});
