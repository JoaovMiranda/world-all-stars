import { type RefObject, useEffect } from 'react';

/**
 * Focuses the given input on Ctrl+K / ⌘K. A modifier is required on purpose: a single-character shortcut ("/")
 * fires while speech-input users dictate or keyboard users type, and WCAG 2.1.4 then requires a way to turn it off.
 */
export function useSlashFocus(ref: RefObject<HTMLInputElement | null>): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
      event.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ref]);
}
