import React from 'react';

interface DualComparisonRowProps {
  label: string;
  valueA1?: string;
  valueA2?: string;
  valueB1?: string;
  valueB2?: string;
  colorA1?: string;
  colorA2?: string;
  colorB1?: string;
  colorB2?: string;
  className?: string;
}

export function DualComparisonRow({
  label,
  valueA1 = '--',
  valueA2 = '--',
  valueB1 = '--',
  valueB2 = '--',
  colorA1 = 'text-slate-300',
  colorA2 = 'text-slate-300',
  colorB1 = 'text-slate-300',
  colorB2 = 'text-slate-300',
  className = ''
}: DualComparisonRowProps) {
  return (
    <div className={className}>
      <div className="text-xs text-slate-400 mb-1 leading-tight">{label}</div>
      <div className="flex items-start justify-between">
        {/* Track A Stack */}
        <div className="flex items-start space-x-2">
          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 mt-0.5">
            A
          </span>
          <div className="flex flex-col">
            <span className={`text-[10px] font-mono leading-tight ${colorA1}`}>
              {valueA1}
            </span>
            <span className={`text-[10px] font-mono leading-tight ${colorA2}`}>
              {valueA2}
            </span>
          </div>
        </div>

        {/* Track B Stack */}
        <div className="flex items-start space-x-2">
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-mono leading-tight ${colorB1}`}>
              {valueB1}
            </span>
            <span className={`text-[10px] font-mono leading-tight ${colorB2}`}>
              {valueB2}
            </span>
          </div>
          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 mt-0.5">
            B
          </span>
        </div>
      </div>
    </div>
  );
}
