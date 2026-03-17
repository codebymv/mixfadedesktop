import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useColorTheme } from '../../hooks/useColorTheme';

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
  const colorTheme = useColorTheme();
  const activityDotStyle = isTrackAPlaying && !isTrackBPlaying
    ? { backgroundColor: colorTheme.deckA.base }
    : isTrackBPlaying && !isTrackAPlaying
      ? { backgroundColor: colorTheme.deckB.base }
      : undefined;

  return (
    <div className="w-6 shrink-0 self-stretch border-r border-slate-700/60 bg-slate-900/60 flex flex-col items-center justify-between px-0 py-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorTheme.deckA.base} />
            <stop offset="100%" stopColor={colorTheme.deckB.base} />
          </linearGradient>
        </defs>
        <Icon size={16} stroke={`url(#${gradientId})`} />
      </svg>

      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300 leading-none [writing-mode:vertical-rl] rotate-180 select-none text-center">
        {title}
      </span>

      {isTransitioning ? (
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-2 h-2 theme-fusion-dot rounded-full animate-pulse"></div>
          <span className="text-[9px] text-slate-400 font-medium uppercase tracking-[0.12em] leading-none [writing-mode:vertical-rl] rotate-180 select-none">
            XF
          </span>
        </div>
      ) : (isTrackAPlaying || isTrackBPlaying) && (
        <div className="w-2 h-2 rounded-full animate-pulse shrink-0 theme-fusion-dot" style={activityDotStyle}></div>
      )}
    </div>
  );
}