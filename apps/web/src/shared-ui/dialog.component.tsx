import { type ReactNode, useEffect, useId, useRef } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { Button } from './button.component';
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
 * returns to the element that opened it.
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
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      onClose={() => {
        opener.current?.focus();
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
      {dismissible && (
        <Button variant="ghost" size="icon" className="dialog-close" aria-label={ui.close} onClick={onClose}>
          ×
        </Button>
      )}
      {kicker && <span className="label">{kicker}</span>}
      <h2 id={titleId}>{title}</h2>
      {children}
      {actions && <div className="dialog-actions">{actions}</div>}
    </dialog>
  );
}
