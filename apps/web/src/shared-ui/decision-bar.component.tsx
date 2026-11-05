import './review-kit.css';

import { type ReactNode, useState } from 'react';

import { Button } from './button.component';
import type { ButtonVariant } from './button.helper';
import { ConfirmDialog, type ReasonConfig } from './confirm-dialog.component';
import { REVIEW_KIT_TEXT } from './review-kit.const';

export interface DecisionAction {
  key: string;
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Title of the confirmation dialog (defaults to the label). */
  confirmTitle?: ReactNode;
  /** Text/fields shown in the dialog. */
  confirmBody?: ReactNode;
  /** Required reason (approve/reject, hide, ban…). Omit for a plain confirmation. */
  reason?: ReasonConfig;
  /** Runs the decision; a thrown Error is shown in the dialog. */
  onConfirm: (reason: string) => unknown;
}

interface DecisionBarProps {
  /** Accessible name of the group (e.g. "Decisão sobre a proposta"). */
  label: string;
  actions: readonly DecisionAction[];
  kicker?: string;
}

/** Row of decision buttons (approve · reject · …); each one confirms in a ConfirmDialog, with reason when needed. */
export function DecisionBar({ label, actions, kicker }: DecisionBarProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = actions.find((a) => a.key === openKey);
  return (
    <div className="decision-bar" role="group" aria-label={label}>
      {actions.map((a) => (
        <Button key={a.key} size="sm" variant={a.variant ?? 'secondary'} disabled={a.disabled} onClick={() => setOpenKey(a.key)}>
          {a.label}
        </Button>
      ))}
      <ConfirmDialog
        open={Boolean(open)}
        onClose={() => setOpenKey(null)}
        title={open?.confirmTitle ?? open?.label}
        {...(kicker ? { kicker } : {})}
        confirmLabel={open?.label ?? REVIEW_KIT_TEXT.confirm}
        confirmVariant={open?.variant === 'danger' ? 'danger' : 'primary'}
        {...(open?.reason ? { reason: open.reason } : {})}
        onConfirm={(reason) => open?.onConfirm(reason)}
      >
        {open?.confirmBody}
      </ConfirmDialog>
    </div>
  );
}
