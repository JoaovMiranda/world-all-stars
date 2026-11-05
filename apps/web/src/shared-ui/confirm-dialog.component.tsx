import './review-kit.css';

import { type FormEvent, type ReactNode, useEffect, useState } from 'react';

import { Button } from './button.component';
import type { ButtonVariant } from './button.helper';
import { Dialog } from './dialog.component';
import { FormField } from './form-field.component';
import { Notice } from './notice.component';
import { REVIEW_KIT_TEXT } from './review-kit.const';
import { Textarea } from './textarea.component';

export interface ReasonConfig {
  label?: string;
  hint?: string;
  /** Minimum length after trim (required reason). */
  minLength: number;
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  kicker?: string;
  /** Description and/or extra controlled fields (e.g. a Select), rendered above the reason. */
  children?: ReactNode;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  /** Asks for a required reason (kept in the audit log). */
  reason?: ReasonConfig;
  /** Runs on confirm; a thrown/rejected Error shows its message and keeps the dialog open. Closes on success. */
  onConfirm: (reason: string) => unknown;
}

/** Confirmation modal (native Dialog) with optional required reason, pending state and inline error. */
export function ConfirmDialog({ open, onClose, title, kicker, children, confirmLabel = REVIEW_KIT_TEXT.confirm, confirmVariant = 'primary', reason, onConfirm }: ConfirmDialogProps) {
  const [text, setText] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setText('');
    setFieldError(undefined);
    setError(undefined);
    setPending(false);
  }, [open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (reason && text.trim().length < reason.minLength) {
      setFieldError(REVIEW_KIT_TEXT.reasonTooShort(reason.minLength));
      (event.currentTarget as HTMLFormElement).querySelector('textarea')?.focus();
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      await onConfirm(text.trim());
      onClose();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : REVIEW_KIT_TEXT.genericError);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} {...(kicker ? { kicker } : {})}>
      <form className="dialog-form" onSubmit={(e) => void submit(e)} noValidate>
        {children}
        {reason && (
          <FormField label={reason.label ?? REVIEW_KIT_TEXT.reasonLabel} hint={reason.hint ?? REVIEW_KIT_TEXT.reasonHint} error={fieldError} required>
            {(p) => <Textarea {...p} autoFocus rows={3} value={text} onChange={(e) => (setText(e.target.value), fieldError && setFieldError(undefined))} maxLength={500} />}
          </FormField>
        )}
        {error && (
          <Notice tone="danger" live="assertive">
            {error}
          </Notice>
        )}
        <div className="dialog-actions">
          <Button variant="ghost" onClick={onClose}>
            {REVIEW_KIT_TEXT.cancel}
          </Button>
          <Button type="submit" variant={confirmVariant} disabled={pending} aria-busy={pending || undefined}>
            {pending ? REVIEW_KIT_TEXT.working : confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
