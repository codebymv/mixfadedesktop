import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleCardProps {
  title: string;
  icon: ReactNode;
  summary: ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function CollapsibleCard({
  title,
  icon,
  summary,
  isCollapsed,
  onToggle,
  children
}: CollapsibleCardProps) {
  return (
    <div className="bg-slate-800 rounded-md overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700/50 transition-colors cursor-pointer select-none"
        aria-expanded={!isCollapsed}
      >
        <span className="text-slate-400 shrink-0">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-300">{title}</span>
        {isCollapsed && (
          <span className="flex-1 text-right text-[10px] font-mono text-slate-400 truncate pr-1">{summary}</span>
        )}
        <span className="text-slate-500 shrink-0 ml-auto">
          {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </span>
      </button>
      {!isCollapsed && (
        <div className="border-t border-slate-700/60">
          {children}
        </div>
      )}
    </div>
  );
}
