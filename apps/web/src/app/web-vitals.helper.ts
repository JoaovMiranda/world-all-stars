import { ParticipationApi, type WebVital, type WebVitalName } from '@was/shared';

/**
 * Real-user monitoring (doc 12): LCP, INP, CLS, FCP and TTFB of this page load, measured by `web-vitals` in the
 * visitor's browser and sent ONCE, when the page is hidden, with `sendBeacon` (survives tab close, never blocks).
 * The library loads after the page is idle, in its own small chunk. Anonymous: page pathname, values, connection type.
 * Only with the real API (`VITE_DATA_SOURCE=http`); the fixtures mode has no server to receive them.
 */
export function startWebVitals(): void {
  if (typeof window === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
  // The landing page: INP/CLS keep measuring across client navigations but belong to the page that was loaded.
  const path = location.pathname.slice(0, 200) || '/';
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType;
  const queue = new Map<WebVitalName, WebVital>();

  const flush = () => {
    if (!queue.size) return;
    const body = JSON.stringify({ metrics: [...queue.values()] });
    queue.clear();
    navigator.sendBeacon(ParticipationApi.reportWebVitals.path, new Blob([body], { type: 'application/json' }));
  };
  addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
  addEventListener('pagehide', flush);

  const start = () =>
    void import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      const record = (m: { name: WebVitalName; value: number; rating: WebVital['rating']; navigationType: string }) =>
        queue.set(m.name, { name: m.name, value: m.value, rating: m.rating, path, navigationType: m.navigationType, ...(connection ? { connection } : {}) });
      for (const on of [onCLS, onFCP, onINP, onLCP, onTTFB]) on(record);
    });
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 5_000 });
  else setTimeout(start, 2_000);
}
