import { type ReactNode, useEffect, useId, useRef } from 'react';

import { Button } from './button.component';
import { UI_TEXT } from './ui-text.const';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Small caps label above the title. */
  kicker?: string;
  children?: ReactNode;
  /** Buttons at the bottom right. */
  actions?: ReactNode;
}

/**
 * Modal on the native <dialog>: showModal() makes the page inert (focus stays inside), Esc closes, and focus
 * returns to the element that opened it.
 */
export function Dialog({ open, onClose, title, kicker, children, actions }: DialogProps) {
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
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Button variant="ghost" size="icon" className="dialog-close" aria-label={UI_TEXT.close} onClick={onClose}>
        ×
      </Button>
      {kicker && <span className="label">{kicker}</span>}
      <h2 id={titleId}>{title}</h2>
      {children}
      {actions && <div className="dialog-actions">{actions}</div>}
    </dialog>
  );
}
