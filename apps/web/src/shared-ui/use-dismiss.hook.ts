import { type RefObject, useEffect, useRef } from 'react';

/** The disclosure button of a menu root (the element with aria-expanded). */
const triggerOf = (root: HTMLElement | null): HTMLElement | null => root?.querySelector<HTMLElement>('[aria-expanded]') ?? null;

/**
 * Menus and popovers: calls `onDismiss` on Escape, on a pointer down outside `ref`, or when keyboard focus leaves
 * `ref` (Tab past the last item). When the popup closes while focus was inside it (Escape, an item chosen), focus
 * goes back to the trigger instead of falling to <body> (WCAG 2.4.3 focus order).
 */
export function useDismiss(ref: RefObject<HTMLElement | null>, active: boolean, onDismiss: () => void): void {
  // A click elsewhere moves on to what was clicked: focus is only restored for keyboard closes and chosen items.
  const byPointerOutside = useRef(false);
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        byPointerOutside.current = true;
        onDismiss();
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      if (next && ref.current && !ref.current.contains(next)) {
        byPointerOutside.current = true; // focus already went somewhere on purpose
        onDismiss();
      }
    };
    const root = ref.current;
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    root?.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      root?.removeEventListener('focusout', onFocusOut);
    };
  }, [ref, active, onDismiss]);

  // Closing transition: focus that was in the (now unmounted) popup goes back to the trigger.
  const wasActive = useRef(active);
  useEffect(() => {
    if (wasActive.current && !active && !byPointerOutside.current) {
      const focused = document.activeElement;
      if (!focused || focused === document.body || ref.current?.contains(focused)) triggerOf(ref.current)?.focus();
    }
    if (!active) byPointerOutside.current = false;
    wasActive.current = active;
  }, [active, ref]);
}
