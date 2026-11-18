import { useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { MAIN_CONTENT_ID } from '@/shared-ui/layout.const';

/**
 * Client-side navigation for screen-reader and keyboard users (WCAG 2.4.3 / 4.1.3): after a new page resolves, the
 * new <title> is announced in a polite live region and focus moves to the page <h1> (or <main>), as a full page load
 * would do. Changes of search params only (filters, tabs, pagination) and #hash jumps keep focus where it is.
 */
export function RouteAnnouncer() {
  const router = useRouter();
  const [message, setMessage] = useState('');

  useEffect(
    () =>
      router.subscribe('onResolved', ({ fromLocation, toLocation, pathChanged }) => {
        if (!fromLocation || !pathChanged) return;
        // After React committed the new page and the head updated the <title>.
        requestAnimationFrame(() => {
          setMessage(document.title);
          if (toLocation.hash) return;
          const main = document.getElementById(MAIN_CONTENT_ID);
          const heading = main?.querySelector<HTMLElement>('h1');
          if (heading && !heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
          (heading ?? main)?.focus({ preventScroll: true });
        });
      }),
    [router],
  );

  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </p>
  );
}
