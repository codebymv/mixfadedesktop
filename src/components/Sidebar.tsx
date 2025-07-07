import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { activities } from './ActivityBar';
import { AudioLevels, StereoAnalysis } from '../utils/audioAnalysis';

// Import sidebar panels
import { FilesPanel } from './sidebar/FilesPanel';
import { AnalysisPanel } from './sidebar/AnalysisPanel';
import { SettingsPanel } from './sidebar/SettingsPanel';
import { HelpPanel } from './sidebar/HelpPanel';

// Recent files interface - session-only (cleared on app restart)
interface RecentFile {
  id: string;
  name: string;
  size: string;
  lastModified: string;
  lastUsedSide: 'A' | 'B';
  file?: File; // Keep File object in memory during session
}

interface SidebarProps {
  activeActivity: string;
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
  recentFiles?: RecentFile[];
  onLoadFileFromRecent?: (recentFile: RecentFile) => void;
  onLoadToA?: (file: File | null) => void;
  onLoadToB?: (file: File | null) => void;
  // Analysis data props
  trackAFile?: File;
  trackBFile?: File;
  trackAAudioLevels?: AudioLevels;
  trackBAudioLevels?: AudioLevels;
  trackAStereoData?: StereoAnalysis;
  trackBStereoData?: StereoAnalysis;
  trackAFrequencyData?: Float32Array;
  trackBFrequencyData?: Float32Array;
  isTrackAPlaying: boolean;
  isTrackBPlaying: boolean;
  // Crossfade props
  isTransitioning?: boolean;
  volumeA?: number;
  volumeB?: number;
}

export function Sidebar({
  activeActivity,
  isCollapsed,
  onToggle,
  className = '',
  recentFiles = [],
  onLoadFileFromRecent,
  onLoadToA,
  onLoadToB,
  // Analysis data
  trackAFile,
  trackBFile,
  trackAAudioLevels,
  trackBAudioLevels,
  trackAStereoData,
  trackBStereoData,
  trackAFrequencyData,
  trackBFrequencyData,
  isTrackAPlaying,
  isTrackBPlaying,
  // Crossfade data
  isTransitioning = false,
  volumeA = 1,
  volumeB = 0
}: SidebarProps) {
  // Get current activity info
  const currentActivity = activities.find(activity => activity.id === activeActivity);

  // Render appropriate panel content
  const renderContent = () => {
    switch (activeActivity) {
      case 'files':
        return (
          <FilesPanel
            recentFiles={recentFiles}
            onLoadFileFromRecent={onLoadFileFromRecent}
            onLoadToA={onLoadToA}
            onLoadToB={onLoadToB}
          />
        );
      case 'analysis':
        return (
          <AnalysisPanel
            trackAFile={trackAFile}
            trackBFile={trackBFile}
            trackAAudioLevels={trackAAudioLevels}
            trackBAudioLevels={trackBAudioLevels}
            trackAStereoData={trackAStereoData}
            trackBStereoData={trackBStereoData}
            trackAFrequencyData={trackAFrequencyData}
            trackBFrequencyData={trackBFrequencyData}
            isTrackAPlaying={isTrackAPlaying}
            isTrackBPlaying={isTrackBPlaying}
            isTransitioning={isTransitioning}
            volumeA={volumeA}
            volumeB={volumeB}
          />
        );
      case 'settings':
        return <SettingsPanel />;
      case 'help':
        return <HelpPanel />;
      default:
        return (
          <div className="p-4 text-center text-slate-400">
            <p>Select an activity to get started</p>
          </div>
        );
    }
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <div 
      className={`w-56 border-r border-slate-700 flex flex-col transition-all duration-300 ${className}`}
      style={{
        background: `linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.6)), linear-gradient(to right, rgb(16, 185, 129), rgb(168, 85, 247))`,
        backgroundSize: '300% 100%',
        backgroundPosition: '50% 0%'
      }}
    >
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center space-x-2">
          {currentActivity?.icon && (
            <currentActivity.icon size={16} className="text-slate-400" />
          )}
          <h2 className="text-sm font-medium text-slate-200 capitalize">
            {currentActivity?.label || 'Unknown'}
          </h2>
        </div>
        
        <button
          onClick={onToggle}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
          title="Toggle Sidebar (Ctrl+B)"
          aria-label="Toggle Sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-sidebar">
        {renderContent()}
      </div>
      
      {/* Footer (optional) */}
      <div className="border-t border-slate-700 p-2">
        <div className="text-xs text-slate-500 text-center">
          {currentActivity?.shortcut && (
            <span>Press {currentActivity.shortcut}</span>
          )}
        </div>
      </div>
    </div>
  );
}


