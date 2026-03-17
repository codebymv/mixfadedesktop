import { ChevronLeft } from 'lucide-react';
import { activities } from './ActivityBar';
import { AudioLevels, StereoAnalysis } from '../utils/audioAnalysis';

// Import sidebar panels
import { FilesPanel } from './sidebar/FilesPanel';
import { AnalysisPanel } from './sidebar/AnalysisPanel';
import { SettingsPanel } from './sidebar/SettingsPanel';
import { HelpPanel } from './sidebar/HelpPanel';
import { VisualizerPanel } from './sidebar/VisualizerPanel';
import type { SavedSeed } from './sidebar/VisualizerPanel';
import type { RecentFile } from '../types/recentFile';

interface SidebarProps {
  activeActivity: string;
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
  recentFiles?: RecentFile[];
  onLoadFileFromRecent?: (recentFile: RecentFile) => void;
  onAddDroppedFiles?: (files: File[]) => void;
  onLoadToA?: (file: File | null) => void;
  onLoadToB?: (file: File | null) => void;
  // Analysis data props
  trackAFile?: File;
  trackBFile?: File;
  trackADeckLevels?: AudioLevels;
  trackBDeckLevels?: AudioLevels;
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
  // Visualizer seed
  visualizerSeed?: number;
  onRollVisualizerSeed?: () => void;
  onResetVisualizerSeed?: () => void;
  savedVisualizerSeeds?: SavedSeed[];
  onSaveVisualizerSeed?: () => void;
  onLoadVisualizerSeed?: (seed: number) => void;
  onDeleteVisualizerSeed?: (id: string) => void;
}

export function Sidebar({
  activeActivity,
  isCollapsed,
  onToggle,
  className = '',
  recentFiles = [],
  onLoadFileFromRecent,
  onAddDroppedFiles,
  onLoadToA,
  onLoadToB,
  // Analysis data
  trackAFile,
  trackBFile,
  trackADeckLevels,
  trackBDeckLevels,
  trackAStereoData,
  trackBStereoData,
  trackAFrequencyData,
  trackBFrequencyData,
  isTrackAPlaying,
  isTrackBPlaying,
  // Crossfade data
  isTransitioning = false,
  volumeA = 1,
  volumeB = 0,
  // Visualizer seed
  visualizerSeed = 42,
  onRollVisualizerSeed,
  onResetVisualizerSeed,
  savedVisualizerSeeds = [],
  onSaveVisualizerSeed,
  onLoadVisualizerSeed,
  onDeleteVisualizerSeed,
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
            onAddDroppedFiles={onAddDroppedFiles}
            onLoadToA={onLoadToA}
            onLoadToB={onLoadToB}
          />
        );
      case 'analysis':
        return (
          <AnalysisPanel
            trackAFile={trackAFile}
            trackBFile={trackBFile}
            trackADeckLevels={trackADeckLevels}
            trackBDeckLevels={trackBDeckLevels}
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
      case 'visualizer':
        return (
          <VisualizerPanel
            seed={visualizerSeed}
            onRollSeed={onRollVisualizerSeed ?? (() => {})}
            onResetSeed={onResetVisualizerSeed ?? (() => {})}
            savedSeeds={savedVisualizerSeeds}
            onSaveSeed={onSaveVisualizerSeed ?? (() => {})}
            onLoadSeed={onLoadVisualizerSeed ?? (() => {})}
            onDeleteSeed={onDeleteVisualizerSeed ?? (() => {})}
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
      className={`w-56 border-r border-slate-700 flex flex-col transition-all duration-300 theme-sidebar-shell-background ${className}`}
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


