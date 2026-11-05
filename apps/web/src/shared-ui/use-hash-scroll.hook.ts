import { useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';

/**
 * Scrolls to the element of the URL hash once `ready` (content rendered after its query resolved, so the browser's
 * own hash jump already missed it). Returns the hash without "#".
 */
export function useHashScroll(ready = true): string {
  const hash = useLocation().hash.replace(/^#/, '');
  useEffect(() => {
    if (!ready || !hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [hash, ready]);
  return hash;
}
