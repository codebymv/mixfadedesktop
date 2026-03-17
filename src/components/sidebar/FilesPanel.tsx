import React, { useCallback, useRef, useState } from 'react';
import { Music, Upload, Folder } from 'lucide-react';
import type { DeckSide, RecentFile } from '../../types/recentFile';

const ACCEPTED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.flac', '.aiff', '.aif', '.m4a', '.aac', '.ogg'];

const isAcceptedAudioFile = (file: File) => {
  const lowercaseName = file.name.toLowerCase();

  return file.type.startsWith('audio/')
    || ACCEPTED_AUDIO_EXTENSIONS.some(extension => lowercaseName.endsWith(extension));
};


interface FilesPanelProps {
  recentFiles?: RecentFile[];
  onLoadFileFromRecent?: (recentFile: RecentFile) => void;
  onAddDroppedFiles?: (files: File[]) => void;
  onLoadToA?: (file: File | null) => void;
  onLoadToB?: (file: File | null) => void;
}

export function FilesPanel({
  recentFiles = [],
  onLoadFileFromRecent,
  onAddDroppedFiles,
  onLoadToA,
  onLoadToB
}: FilesPanelProps) {
  const dragDepthRef = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [actionMenuFileId, setActionMenuFileId] = useState<string | null>(null);

  const getDroppedAudioFiles = useCallback((dataTransfer: DataTransfer | null) => {
    if (!dataTransfer) {
      return [];
    }

    return Array.from(dataTransfer.files).filter(isAcceptedAudioFile);
  }, []);

  const handlePanelDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepthRef.current += 1;
    setIsDragActive(true);
  }, []);

  const handlePanelDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // preventDefault() is required for the drop event to fire at all.
    // Do NOT read dataTransfer.files here — it's always empty during dragover
    // (browser security). dropEffect = 'none' would suppress the drop event.
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handlePanelDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepthRef.current = Math.max(dragDepthRef.current - 1, 0);
    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  }, []);

  const handlePanelDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setIsDragActive(false);

    const droppedAudioFiles = getDroppedAudioFiles(e.dataTransfer);
    if (droppedAudioFiles.length > 0) {
      onAddDroppedFiles?.(droppedAudioFiles);
    }
  }, [getDroppedAudioFiles, onAddDroppedFiles]);

  // Handle Load to A button
  const handleLoadToA = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onLoadToA) {
        onLoadToA(file);
      }
    };
    input.click();
  };

  // Handle Load to B button
  const handleLoadToB = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onLoadToB) {
        onLoadToB(file);
      }
    };
    input.click();
  };

  const handleRecentFileClick = useCallback((file: RecentFile) => {
    if (!file.lastUsedSide) {
      setActionMenuFileId(currentId => currentId === file.id ? null : file.id);
      return;
    }

    setActionMenuFileId(null);
    onLoadFileFromRecent?.(file);
  }, [onLoadFileFromRecent]);

  const handleAssignDroppedFile = useCallback((file: RecentFile, side: DeckSide) => {
    if (!file.file) {
      return;
    }

    setActionMenuFileId(null);

    if (side === 'A') {
      onLoadToA?.(file.file);
      return;
    }

    onLoadToB?.(file.file);
  }, [onLoadToA, onLoadToB]);

  return (
    <div className="p-4 space-y-6">

      {/* Quick Load Actions — intentionally outside the dropzone */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Quick Load</h3>
        <div className="space-y-1">
          <button
            onClick={handleLoadToA}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-white sidebar-deck-button sidebar-deck-button-a group"
          >
            <Upload size={16} className="text-[var(--theme-deck-a-base)] sidebar-icon" />
            <span>Load to Deck A</span>
          </button>
          <button
            onClick={handleLoadToB}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-white sidebar-deck-button sidebar-deck-button-b group"
          >
            <Upload size={16} className="text-[var(--theme-deck-b-base)] sidebar-icon" />
            <span>Load to Deck B</span>
          </button>
        </div>
      </div>

      {/* Recent Files */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">My Files</h3>
        </div>
        {recentFiles.length === 0 ? (
          <div className="text-center py-8">
            <Folder size={32} className="text-white/60 mx-auto mb-3" />
            <p className="text-sm text-white">No files</p>
            <p className="text-xs text-white/70">Load files or drag them here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentFiles.map((file) => {
              const isUnassigned = file.lastUsedSide === null;
              const isActionMenuOpen = actionMenuFileId === file.id;

              const hoverClass = isUnassigned
                ? 'sidebar-item-unassigned'
                : file.lastUsedSide === 'A'
                ? 'sidebar-deck-button-a'
                : 'sidebar-deck-button-b';

              return (
                <div key={file.id} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleRecentFileClick(file)}
                    aria-expanded={isUnassigned ? isActionMenuOpen : undefined}
                    className={`w-full flex items-start space-x-3 px-3 py-2 text-sm rounded-md cursor-pointer text-left group sidebar-deck-button ${hoverClass}`}
                    title={`Click to load ${file.name}${file.lastUsedSide ? ` to deck ${file.lastUsedSide}` : ''}`}
                  >
                    <Music size={16} className="mt-0.5 text-slate-400 group-hover:text-slate-300 shrink-0 sidebar-icon" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-slate-300 truncate">{file.name}</p>
                        {file.lastUsedSide && (
                          <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 font-bold ${file.lastUsedSide === 'A'
                              ? 'bg-[var(--theme-deck-a-base)]/20 text-[var(--theme-deck-a-text)]'
                              : 'bg-[var(--theme-deck-b-base)]/20 text-[var(--theme-deck-b-text)]'
                            }`}>
                            {file.lastUsedSide}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/70">{file.size} • {file.lastModified}</p>
                    </div>
                  </button>

                  {isUnassigned && isActionMenuOpen && file.file && (
                    <div className="grid grid-cols-2 gap-2 pl-8 pr-1">
                      <button
                        type="button"
                        onClick={() => handleAssignDroppedFile(file, 'A')}
                        aria-label={`Load ${file.name} to deck A`}
                        className="px-3 py-2 rounded-md bg-[var(--theme-deck-a-base)]/15 text-[var(--theme-deck-a-text)] border border-[var(--theme-deck-a-base)]/30 hover:bg-[var(--theme-deck-a-base)]/25 transition-all duration-200 active:scale-[0.97]"
                      >
                        Load Deck A
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignDroppedFile(file, 'B')}
                        aria-label={`Load ${file.name} to deck B`}
                        className="px-3 py-2 rounded-md bg-[var(--theme-deck-b-base)]/15 text-[var(--theme-deck-b-text)] border border-[var(--theme-deck-b-base)]/30 hover:bg-[var(--theme-deck-b-base)]/25 transition-all duration-200 active:scale-[0.97]"
                      >
                        Load Deck B
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drop zone — always below the file list / empty state */}
      <div
        data-testid="files-panel-dropzone"
        onDragEnter={handlePanelDragEnter}
        onDragOver={handlePanelDragOver}
        onDragLeave={handlePanelDragLeave}
        onDrop={handlePanelDrop}
        className={[
          'flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition-all duration-200',
          isDragActive
            ? 'border-[var(--theme-deck-a-base)]/70 bg-theme-fusion bg-opacity-15 shadow-[0_0_24px_rgb(var(--theme-deck-a-base-rgb)/0.25)]'
            : 'border-white/10 bg-white/[0.03] hover:border-white/20',
        ].join(' ')}
      >
        <Upload
          size={18}
          className={isDragActive ? 'text-[var(--theme-deck-a-text)]' : 'text-white/30'}
        />
        <p className={`text-xs ${isDragActive ? 'text-white font-medium' : 'text-white/40'}`}>
          {isDragActive ? 'Release to stage files' : 'Drag files here'}
        </p>
      </div>
    </div>
  );
}

