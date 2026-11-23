import { useEffect, useRef, useState } from 'react';

/**
 * Local text state for a search box bound to a URL param: typing stays smooth (spaces kept) and the URL is updated
 * after `delay` ms; external URL changes ("Clear filters") flow back into the box.
 */
export function useUrlSearchText(urlValue: string | undefined, commit: (value: string | undefined) => void, delay = 200) {
  const [text, setText] = useState(urlValue ?? '');
  const commitRef = useRef(commit);
  commitRef.current = commit;
  const lastCommitted = useRef(urlValue ?? '');

  useEffect(() => {
    if ((urlValue ?? '') !== lastCommitted.current) {
      lastCommitted.current = urlValue ?? '';
      setText(urlValue ?? '');
    }
  }, [urlValue]);

  useEffect(() => {
    if (text.trim() === lastCommitted.current) return;
    const id = window.setTimeout(() => {
      lastCommitted.current = text.trim();
      commitRef.current(text.trim() || undefined);
    }, delay);
    return () => window.clearTimeout(id);
  }, [text, delay]);

  return [text, setText] as const;
}
