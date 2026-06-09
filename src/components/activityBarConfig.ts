import { Activity, Bug, Folder, Monitor, Settings, type LucideIcon } from 'lucide-react';

export interface ActivityItem {
  id: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  shortcut?: string;
}

export const activities: ActivityItem[] = [
  {
    id: 'files',
    icon: Folder,
    label: 'Files',
    shortcut: 'Ctrl+Shift+E'
  },
  {
    id: 'analysis',
    icon: Activity,
    label: 'Analysis',
    shortcut: 'Ctrl+Shift+A'
  },
  {
    id: 'visualizer',
    icon: Monitor,
    label: 'Visualizer',
    shortcut: 'Ctrl+Shift+V'
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
