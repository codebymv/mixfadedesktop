import { useCallback, useState } from 'react';

const COLLAPSED_KEY = 'mixfade_analysis_collapsed';

export function useCollapsedSections() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const toggle = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save state to localStorage:', e);
      }
      return next;
    });
  }, []);

  return { collapsed, toggle };
}
