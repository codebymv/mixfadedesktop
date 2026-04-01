import React, { useCallback, useRef } from 'react';
import { Upload, Music, X, FileAudio } from 'lucide-react';

interface FileUploadProps {
  label: string;
  color: 'green' | 'purple';
  file: File | null;
  onFileSelect: (file: File | null) => void;
}

export function FileUpload({ label, color, file, onFileSelect }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const dragDepthRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragDepthRef.current += 1;
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragDepthRef.current = Math.max(dragDepthRef.current - 1, 0);
    if (dragDepthRef.current === 0) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(f => f.type.startsWith('audio/') || 
      ['.wav', '.mp3', '.flac', '.aiff', '.aif', '.m4a', '.aac', '.ogg'].some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (audioFile) {
      onFileSelect(audioFile);
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  // Truncate filename and add extension
  const getTruncatedFilename = (filename: string, maxLength: number = 29) => {
    if (filename.length <= maxLength) return filename;
    
    const lastDotIndex = filename.lastIndexOf('.');
    const extension = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    const nameWithoutExt = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
    
    // User requested ~20 chars before truncation
    const truncatedName = nameWithoutExt.substring(0, maxLength) + '...';
    return truncatedName + extension;
  };

  const colorClasses = {
    green: 'border-[var(--theme-deck-a-base)]/50 bg-[var(--theme-deck-a-base)]/10',
    purple: 'border-[var(--theme-deck-b-base)]/50 bg-[var(--theme-deck-b-base)]/10'
  };

  const iconBgColor = {
    green: 'bg-[var(--theme-deck-a-base)]',
    purple: 'bg-[var(--theme-deck-b-base)]'
  };

  const deckTextColor = {
    green: 'text-[var(--theme-deck-a-text)]',
    purple: 'text-[var(--theme-deck-b-text)]'
  };

  const deckButtonClasses = {
    green: 'bg-gradient-to-r from-[var(--theme-deck-a-base)] to-[var(--theme-deck-a-strong)] border-[var(--theme-deck-a-text)]/40 shadow-[0_12px_30px_rgba(var(--theme-deck-a-base-rgb),0.28)]',
    purple: 'bg-gradient-to-r from-[var(--theme-deck-b-base)] to-[var(--theme-deck-b-strong)] border-[var(--theme-deck-b-text)]/40 shadow-[0_12px_30px_rgba(var(--theme-deck-b-base-rgb),0.28)]'
  };

  const deckButtonHoverClasses = {
    green: 'hover:bg-[var(--theme-deck-a-base)]/20 hover:border-[var(--theme-deck-a-base)]/50',
    purple: 'hover:bg-[var(--theme-deck-b-base)]/20 hover:border-[var(--theme-deck-b-base)]/50'
  };

  const glowClasses = {
    green: 'neon-glow-fusion',
    purple: 'neon-glow-fusion'
  };

  // Extract the letter (A or B) from the label
  const letter = label.split(' ')[1];
  const isAudioB = letter === 'B';

  return (
    <div 
      className="relative group h-full"
      onDragEnter={handleDragEnter}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*"
        onChange={handleFileInput}
        className="hidden"
      />
      
      <div className="flex items-center justify-between mb-3 px-1">
        {/* Deck A: Icon + Title on left, X button on right */}
        {!isAudioB && (
          <>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">
                <span className="text-white">Deck {letter}</span>
              </h3>
              <div className="relative">
                <div className={`w-5 h-5 ${iconBgColor[color]} rounded-lg shadow-lg`}></div>
                <FileAudio className="absolute inset-0 m-auto text-white" size={12} />
              </div>
            </div>
            {file && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLoadClick}
                  className={`p-2 glass-panel rounded-xl transition-all duration-200 text-audio-text-dim hover:text-white border border-slate-600 ${deckButtonHoverClasses[color]}`}
                  title="Load new file"
                  style={{ outline: 'none', outlineWidth: 0 }}
                >
                  <Upload size={16} />
                </button>
                <button
                  onClick={() => onFileSelect(null)}
                  className={`p-2 glass-panel rounded-xl transition-all duration-200 text-audio-text-dim hover:text-white border border-slate-600 ${deckButtonHoverClasses[color]}`}
                  title="Clear track"
                  style={{ outline: 'none', outlineWidth: 0 }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </>
        )}
        
        {/* Deck B: X button on left, Title + Icon on right */}
        {isAudioB && (
          <>
            {file && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onFileSelect(null)}
                  className={`p-2 glass-panel rounded-xl transition-all duration-200 text-audio-text-dim hover:text-white border border-slate-600 ${deckButtonHoverClasses[color]}`}
                  title="Clear track"
                  style={{ outline: 'none', outlineWidth: 0 }}
                >
                  <X size={16} />
                </button>
                <button
                  onClick={handleLoadClick}
                  className={`p-2 glass-panel rounded-xl transition-all duration-200 text-audio-text-dim hover:text-white border border-slate-600 ${deckButtonHoverClasses[color]}`}
                  title="Load new file"
                  style={{ outline: 'none', outlineWidth: 0 }}
                >
                  <Upload size={16} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">
                <span className="text-white">Deck {letter}</span>
              </h3>
              <div className="relative">
                <div className={`w-5 h-5 ${iconBgColor[color]} rounded-lg shadow-lg`}></div>
                <FileAudio className="absolute inset-0 m-auto text-white" size={12} />
              </div>
            </div>
          </>
        )}
      </div>
      
      {file ? (
        <div className={`relative glass-panel p-4 rounded-3xl border-2 transition-all duration-300 overflow-hidden ${
          isDraggingOver 
            ? color === 'green'
              ? 'border-[var(--theme-deck-a-base)] bg-[var(--theme-deck-a-base)]/20 shadow-[0_0_32px_rgb(var(--theme-deck-a-base-rgb)/0.3)]'
              : 'border-[var(--theme-deck-b-base)] bg-[var(--theme-deck-b-base)]/20 shadow-[0_0_32px_rgb(var(--theme-deck-b-base-rgb)/0.3)]'
            : `${colorClasses[color]} border-slate-600`
        }`}>
          <div className={`flex items-center gap-4 ${isAudioB ? 'flex-row-reverse' : ''}`}>
            <div className={`p-3 rounded-2xl ${iconBgColor[color]} shadow-lg`}>
              <Music className="text-white" size={24} />
            </div>
            <div className={`flex-1 min-w-0 ${isAudioB ? 'text-right' : ''}`}>
              <p className="text-white font-semibold text-lg truncate whitespace-nowrap" title={file.name}>
                {getTruncatedFilename(file.name)}
              </p>
              <div className={`flex items-center gap-4 mt-1 ${isAudioB ? 'justify-end' : ''}`}>
                <p className="text-audio-text-dim text-sm font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 ${iconBgColor[color]} rounded-full animate-pulse`}></div>
                  <span className={`${deckTextColor[color]} text-sm font-medium`}>Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Replacement Overlay - glow is enough */}
          {isDraggingOver && (
            <div className="pointer-events-none absolute inset-0 z-10 bg-slate-900/10" />
          )}
        </div>
      ) : (
        <div
          className={`glass-panel py-4 px-12 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
            isDraggingOver
              ? color === 'green'
                ? 'border-[var(--theme-deck-a-base)] bg-[var(--theme-deck-a-base)]/20 shadow-[0_0_32px_rgb(var(--theme-deck-a-base-rgb)/0.3)]'
                : 'border-[var(--theme-deck-b-base)] bg-[var(--theme-deck-b-base)]/20 shadow-[0_0_32px_rgb(var(--theme-deck-b-base-rgb)/0.3)]'
              : `${colorClasses[color]} border-slate-600`
          }`}
          style={{ outline: 'none', outlineWidth: 0 }}
          onClick={handleLoadClick}
        >
          <div className="text-center">
            <div className={`mx-auto mb-2 flex w-full max-w-[334px] items-center justify-center rounded-3xl border px-4 py-4 text-white ${deckButtonClasses[color]}`}>
              <Upload className="mx-auto text-white" size={32} />
            </div>
            <p className="text-white font-semibold text-lg mb-2">Drag file here</p>
            <p className="text-audio-text-dim text-sm">or click to browse • WAV, MP3, FLAC, AIFF</p>
          </div>
        </div>
      )}
    </div>
  );
}
