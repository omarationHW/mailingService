import { useEffect, useRef } from 'react';

/**
 * Calls `refresh` on a fixed interval AND whenever the browser tab becomes visible again.
 * Pass `enabled = false` to pause both mechanisms (e.g. when there is nothing live to watch).
 * The refresh callback should be stable (wrapped in useCallback).
 */
export function useAutoRefresh(
  refresh: () => void,
  intervalMs: number,
  enabled = true,
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  // Interval polling
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => refreshRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs]);

  // Refresh on tab visibility restored
  useEffect(() => {
    if (!enabled) return;
    const handler = () => {
      if (document.visibilityState === 'visible') refreshRef.current();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [enabled]);
}

/**
 * Calls `refresh` only when the tab becomes visible again (no interval).
 * Useful for pages where data changes slowly and polling would be wasteful.
 */
export function useVisibilityRefresh(refresh: () => void, enabled = true) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled) return;
    const handler = () => {
      if (document.visibilityState === 'visible') refreshRef.current();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [enabled]);
}
