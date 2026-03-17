import React from 'react';

interface ComparisonRowProps {
  label: string;
  valueA?: string;
  valueB?: string;
  deltaText?: string;
  deltaColor?: string;
  showDelta?: boolean;
  className?: string;
}

export function ComparisonRow({
  label,
  valueA = '--',
  valueB = '--',
  deltaText,
  deltaColor = 'text-slate-400',
  showDelta = true,
  className = ''
}: ComparisonRowProps) {
  return (
    <div className={className}>
      <div className="text-xs text-slate-400 mb-1 leading-tight">{label}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
            A
          </span>
          <span className="text-[10px] text-slate-300 font-mono">
            {valueA}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-slate-300 font-mono">
            {valueB}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
            B
          </span>
        </div>
      </div>
      {showDelta && deltaText && (
        <div className="text-center mt-1">
          <span className={`text-xs font-mono ${deltaColor}`}>
            Δ {deltaText}
          </span>
        </div>
      )}
    </div>
  );
}