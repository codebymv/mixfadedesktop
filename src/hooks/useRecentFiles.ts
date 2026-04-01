import { useCallback, useState } from 'react';
import type { DeckSide, RecentFile } from '../types/recentFile';

interface UseRecentFilesOptions {
  recentFilesLimit: number;
  setTrackA: (file: File | null) => void;
  setTrackB: (file: File | null) => void;
}

interface UseRecentFilesResult {
  recentFiles: RecentFile[];
  stageDroppedFiles: (files: File[]) => void;
  setTrackAWithRecent: (file: File | null) => void;
  setTrackBWithRecent: (file: File | null) => void;
  loadFileFromRecent: (recentFile: RecentFile) => void;
}

const getRecentFileId = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const createRecentFileEntry = (file: File, lastUsedSide: DeckSide | null): RecentFile => ({
  id: getRecentFileId(file),
  name: file.name,
  size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
  lastModified: new Date(file.lastModified).toLocaleDateString(),
  lastUsedSide,
  file,
});

export function useRecentFiles({
  recentFilesLimit,
  setTrackA,
  setTrackB,
}: UseRecentFilesOptions): UseRecentFilesResult {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  const addToRecentFiles = useCallback((file: File, side: DeckSide) => {
    const fileId = getRecentFileId(file);

    setRecentFiles(prev => {
      const filtered = prev.filter(existing => existing.id !== fileId);
      return [createRecentFileEntry(file, side), ...filtered].slice(0, recentFilesLimit);
    });
  }, [recentFilesLimit]);

  const stageDroppedFiles = useCallback((files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setRecentFiles(prev => {
      const uniqueDroppedFiles = Array.from(new Map(files.map(file => [getRecentFileId(file), file])).values());
      const droppedIds = new Set(uniqueDroppedFiles.map(getRecentFileId));
      const filtered = prev.filter(file => !droppedIds.has(file.id));

      const stagedFiles = uniqueDroppedFiles.map(file => {
        const existingFile = prev.find(existing => existing.id === getRecentFileId(file));
        return createRecentFileEntry(file, existingFile?.lastUsedSide ?? null);
      });

      return [...stagedFiles, ...filtered].slice(0, recentFilesLimit);
    });
  }, [recentFilesLimit]);

  const setTrackAWithRecent = useCallback((file: File | null) => {
    setTrackA(file);
    if (file) {
      addToRecentFiles(file, 'A');
    }
  }, [addToRecentFiles, setTrackA]);

  const setTrackBWithRecent = useCallback((file: File | null) => {
    setTrackB(file);
    if (file) {
      addToRecentFiles(file, 'B');
    }
  }, [addToRecentFiles, setTrackB]);

  const loadFileFromRecent = useCallback((recentFile: RecentFile) => {
    if (recentFile.file) {
      if (!recentFile.lastUsedSide) {
        console.warn('Recent file has no deck assignment yet:', recentFile.name);
        return;
      }

      if (recentFile.lastUsedSide === 'A') {
        setTrackAWithRecent(recentFile.file);
      } else {
        setTrackBWithRecent(recentFile.file);
      }
      return;
    }

    console.error('File object missing from recent file - this should not happen with session-only files');
  }, [setTrackAWithRecent, setTrackBWithRecent]);

  return {
    recentFiles,
    stageDroppedFiles,
    setTrackAWithRecent,
    setTrackBWithRecent,
    loadFileFromRecent,
  };
}
