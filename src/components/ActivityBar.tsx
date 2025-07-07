import React from 'react';
import { Folder, BookOpen, Settings, Bug, ChevronRight, LucideIcon } from 'lucide-react';

export interface ActivityItem {
  id: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  shortcut?: string;
}

interface ActivityBarProps {
  activeId: string;
  onActivityChange: (id: string) => void;
  className?: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

// Define activities for MixFade
export const activities: ActivityItem[] = [
  {
    id: 'files',
    icon: Folder,
    label: 'Files',
    shortcut: 'Ctrl+Shift+E'
  },
  {
    id: 'analysis',
    icon: BookOpen,
    label: 'Analysis',
    shortcut: 'Ctrl+Shift+A'
  },
  {
    id: 'settings',
    icon: Settings,
    label: 'Settings',
    shortcut: 'Ctrl+,'
  },
  {
    id: 'help',
    icon: Bug,
    label: 'Report Bug',
    shortcut: 'F1'
  }
];

export function ActivityBar({ activeId, onActivityChange, className = '', isSidebarCollapsed, onToggleSidebar }: ActivityBarProps) {
  return (
    <div className={`w-12 bg-slate-800 border-r border-slate-700 flex flex-col ${className}`}>

      {/* Main Activities */}
      <div>
        {activities.slice(0, 2).map(({ id, icon: Icon, label, badge, shortcut }) => (
          <button
            key={id}
            onClick={() => onActivityChange(id)}
            className={`
              w-12 h-12 flex items-center justify-center relative group
              hover:bg-slate-700 transition-all duration-200
              ${activeId === id
                ? 'bg-slate-600 border-r-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
              }
            `}
            title={`${label} (${shortcut})`}
            aria-label={label}
          >
            {activeId === id ? (
              <svg key={`${id}-active`} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(16, 185, 129)" />
                    <stop offset="100%" stopColor="rgb(168, 85, 247)" />
                  </linearGradient>
                </defs>
                <Icon size={24} className={`stroke-[url(#gradient-${id})]`} />
              </svg>
            ) : (
              <Icon key={`${id}-inactive`} size={24} className="transition-colors duration-200 stroke-current" />
            )}

            {/* Badge for notifications */}
            {badge && badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                {badge > 99 ? '99+' : badge}
              </span>
            )}

            {/* Active indicator */}
            {activeId === id && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-500 to-purple-500 rounded-r-sm" />
            )}
          </button>
        ))}
      </div>

      {/* Middle section - Sidebar Toggle Button (centered vertically) */}
      <div className="flex-1 flex items-center justify-center">
        {isSidebarCollapsed && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="
              w-12 h-12 flex items-center justify-center relative group
              hover:bg-slate-700 transition-all duration-200
              text-slate-400 hover:text-slate-200
            "
            title="Show Sidebar (Ctrl+B)"
            aria-label="Show Sidebar"
          >
            <ChevronRight size={20} className="transition-colors duration-200" />
          </button>
        )}
      </div>

      {/* Bottom Activities (Settings, Help) */}
      <div className="border-t border-slate-700">
        {activities.slice(2).map(({ id, icon: Icon, label, badge, shortcut }) => (
          <button
            key={id}
            onClick={() => onActivityChange(id)}
            className={`
              w-12 h-12 flex items-center justify-center relative group
              hover:bg-slate-700 transition-all duration-200
              ${activeId === id 
                ? 'bg-slate-600 border-r-2 border-emerald-500' 
                : 'text-slate-400 hover:text-slate-200'
              }
            `}
            title={`${label} (${shortcut})`}
            aria-label={label}
          >
            {activeId === id ? (
              <svg key={`${id}-active`} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(16, 185, 129)" />
                    <stop offset="100%" stopColor="rgb(168, 85, 247)" />
                  </linearGradient>
                </defs>
                <Icon size={24} className={`stroke-[url(#gradient-${id})]`} />
              </svg>
            ) : (
              <Icon key={`${id}-inactive`} size={24} className="transition-colors duration-200 stroke-current" />
            )}
            
            {/* Badge for notifications */}
            {badge && badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
            
            {/* Active indicator */}
            {activeId === id && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-500 to-purple-500 rounded-r-sm" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
