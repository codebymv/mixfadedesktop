import React from 'react';
import { Music, Upload } from 'lucide-react';

// Recent files interface - session-only (cleared on app restart)
interface RecentFile {
  id: string;
  name: string;
  size: string;
  lastModified: string;
  lastUsedSide: 'A' | 'B';
  file?: File; // Keep File object in memory during session
}

interface FilesPanelProps {
  recentFiles?: RecentFile[];
  onLoadFileFromRecent?: (recentFile: RecentFile) => void;
  onLoadToA?: (file: File | null) => void;
  onLoadToB?: (file: File | null) => void;
}

export function FilesPanel({
  recentFiles = [],
  onLoadFileFromRecent,
  onLoadToA,
  onLoadToB
}: FilesPanelProps) {
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

  return (
    <div className="p-4 space-y-6">
      {/* Quick Load Actions */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Quick Load</h3>
        <div className="space-y-1">
          <button
            onClick={handleLoadToA}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <Upload size={16} className="text-emerald-500" />
            <span>Load to A</span>
          </button>
          <button
            onClick={handleLoadToB}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <Upload size={16} className="text-purple-500" />
            <span>Load to B</span>
          </button>
        </div>
      </div>

      {/* Recent Files */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Recent Files</h3>
        </div>
        {recentFiles.length === 0 ? (
          <div className="text-center py-8">
            <Music size={32} className="text-white/60 mx-auto mb-2" />
            <p className="text-sm text-white">No recent files</p>
            <p className="text-xs text-white/70">Load some audio files to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => onLoadFileFromRecent?.(file)}
                className="flex items-center space-x-3 px-3 py-2 text-sm hover:bg-slate-800 rounded-md cursor-pointer transition-colors group"
                title={`Click to load ${file.name} to deck ${file.lastUsedSide}`}
              >
                <Music size={16} className="text-slate-400 group-hover:text-slate-300" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-slate-300 truncate">{file.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      file.lastUsedSide === 'A'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {file.lastUsedSide}
                    </span>
                  </div>
                  <p className="text-xs text-white/70">{file.size} • {file.lastModified}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
