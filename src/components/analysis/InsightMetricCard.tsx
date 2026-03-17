import React from 'react';

interface InsightMetricCardProps {
  label: string;
  value: string;
  valueClassName?: string;
}

export function InsightMetricCard({
  label,
  value,
  valueClassName = 'text-white'
}: InsightMetricCardProps) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-700/50 bg-slate-900/70 px-2.5 py-2">
      <div className="truncate text-[10px] uppercase tracking-[0.16em] text-slate-500 whitespace-nowrap">
        {label}
      </div>
      <div className={`mt-1 truncate text-sm font-bold font-mono tabular-nums whitespace-nowrap ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
}