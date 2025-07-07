import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AnalysisSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  isTransitioning?: boolean;
  isTrackAPlaying?: boolean;
  isTrackBPlaying?: boolean;
  gradientId: string;
}

export function AnalysisSectionHeader({
  icon: Icon,
  title,
  isTransitioning = false,
  isTrackAPlaying = false,
  isTrackBPlaying = false,
  gradientId
}: AnalysisSectionHeaderProps) {
  return (
    <div className="flex items-center space-x-3 mb-3">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(16, 185, 129)" />
            <stop offset="100%" stopColor="rgb(168, 85, 247)" />
          </linearGradient>
        </defs>
        <Icon size={16} stroke={`url(#${gradientId})`} />
      </svg>
      <span className="text-sm text-slate-300">{title}</span>
      {isTransitioning ? (
        <div className="flex items-center space-x-1 ml-auto">
          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-purple-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400 font-medium">CROSSFADE</span>
        </div>
      ) : (isTrackAPlaying || isTrackBPlaying) && (
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto"></div>
      )}
    </div>
  );
}