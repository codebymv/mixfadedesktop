import React, { useCallback } from 'react';
import { Upload, Music, X, FileAudio } from 'lucide-react';

interface FileUploadProps {
  label: string;
  color: 'green' | 'purple';
  file: File | null;
  onFileSelect: (file: File | null) => void;
}

export function FileUpload({ label, color, file, onFileSelect }: FileUploadProps) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(f => f.type.startsWith('audio/'));
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

  // Truncate filename and add extension
  const getTruncatedFilename = (filename: string, maxLength: number = 20) => {
    if (filename.length <= maxLength) return filename;
    
    const lastDotIndex = filename.lastIndexOf('.');
    const extension = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    const nameWithoutExt = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
    
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3) + '...';
    return truncatedName + extension;
  };

  const colorClasses = {
    green: 'border-emerald-500/50 bg-emerald-500/10 hover:bg-gradient-to-br hover:from-emerald-500/20 hover:to-purple-500/10 hover:border-emerald-400',
    purple: 'border-purple-500/50 bg-purple-500/10 hover:bg-gradient-to-br hover:from-purple-500/20 hover:to-emerald-500/10 hover:border-purple-400'
  };



  const iconBgColor = {
    green: 'bg-emerald-500',
    purple: 'bg-purple-500'
  };

  const glowClasses = {
    green: 'neon-glow-fusion',
    purple: 'neon-glow-fusion'
  };

  // Extract the letter (A or B) from the label
  const letter = label.split(' ')[1];
  const isAudioB = letter === 'B';

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-4">
        {/* Audio A: Icon + Title on left, X button on right */}
        {!isAudioB && (
          <>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">
                <span className="text-white">Audio {letter}</span>
              </h3>
              <div className="relative">
                <div className={`w-5 h-5 ${iconBgColor[color]} rounded-lg shadow-lg`}></div>
                <FileAudio className="absolute inset-0 m-auto text-white" size={12} />
              </div>
            </div>
            {file && (
              <button
                onClick={() => onFileSelect(null)}
                className="p-2 glass-panel rounded-xl hover:bg-gradient-to-br hover:from-emerald-500/20 hover:to-purple-500/20 transition-all duration-200 text-audio-text-dim hover:text-white border border-slate-600 hover:border-transparent"
                style={{ outline: 'none', outlineWidth: 0 }}
              >
                <X size={16} />
              </button>
            )}
          </>
        )}
        
        {/* Audio B: X button on left, Title + Icon on right */}
        {isAudioB && (
          <>
            {file && (
              <button
                onClick={() => onFileSelect(null)}
                className="p-2 glass-panel rounded-xl hover:bg-gradient-to-br hover:from-emerald-500/20 hover:to-purple-500/20 transition-all duration-200 text-audio-text-dim hover:text-white border border-slate-600 hover:border-transparent"
                style={{ outline: 'none', outlineWidth: 0 }}
              >
                <X size={16} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">
                <span className="text-white">Audio {letter}</span>
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
        <div className={`glass-panel p-6 rounded-3xl border-2 transition-all duration-300 ${colorClasses[color]} ${glowClasses[color]} border-slate-600`}>
          <div className={`flex items-center gap-4 ${isAudioB ? 'flex-row-reverse' : ''}`}>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-purple-500 shadow-lg">
              <Music className="text-white" size={24} />
            </div>
            <div className={`flex-1 min-w-0 ${isAudioB ? 'text-right' : ''}`}>
              <p className="text-white font-semibold text-lg" title={file.name}>
                {getTruncatedFilename(file.name)}
              </p>
              <div className={`flex items-center gap-4 mt-1 ${isAudioB ? 'justify-end' : ''}`}>
                <p className="text-audio-text-dim text-sm font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-emerald-400 text-sm font-medium">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`glass-panel p-12 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer group-hover:scale-[1.02] ${colorClasses[color]} border-slate-600`}
          style={{ outline: 'none', outlineWidth: 0 }}
        >
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-3xl"
            style={{ outline: 'none', outlineWidth: 0 }}
          />
          <div className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-purple-500/20 border border-slate-600">
              <Upload className="mx-auto text-white" size={32} />
            </div>
            <p className="text-white font-semibold text-lg mb-2">Drop your audio file here</p>
            <p className="text-audio-text-dim text-sm">or click to browse • WAV, MP3, FLAC, AIFF</p>
          </div>
        </div>
      )}
    </div>
  );
}