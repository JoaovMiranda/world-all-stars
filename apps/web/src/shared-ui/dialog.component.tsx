import { type ReactNode, useEffect, useId, useRef } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { Button } from './button.component';
import { MAIN_CONTENT_ID } from './layout.const';
import { UI_MESSAGES } from './ui-text.const';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Small caps label above the title. */
  kicker?: string;
  children?: ReactNode;
  /** Buttons at the bottom right. */
  actions?: ReactNode;
  /** false = blocking: no ×, Esc and backdrop clicks do nothing (the actions are the only way out). */
  dismissible?: boolean;
}

/**
 * Modal on the native <dialog>: showModal() makes the page inert (focus stays inside), Esc closes, and focus
 * returns to the element that opened it, or to <main> when that element is gone (an approved queue item…).
 * The × comes last in the DOM (placed top-right by CSS), so the first Tab stop is the dialog's own content.
 */
export function Dialog({ open, onClose, title, kicker, children, actions, dismissible = true }: DialogProps) {
  const ui = useText(UI_MESSAGES);
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    // Backdrop click is a mouse shortcut only: Escape and the close button do the same from the keyboard.
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      onClose={() => {
        const back = opener.current?.isConnected ? opener.current : document.getElementById(MAIN_CONTENT_ID);
        back?.focus();
        if (open) onClose();
      }}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      {kicker && <span className="label">{kicker}</span>}
      <h2 id={titleId}>{title}</h2>
      {children}
      {actions && <div className="dialog-actions">{actions}</div>}
      {dismissible && (
        <Button variant="ghost" size="icon" className="dialog-close" aria-label={ui.close} onClick={onClose}>
          ×
        </Button>
      )}
    </dialog>
  );
}
