import './review-kit.css';

import { useState } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { Button } from './button.component';
import { ConfirmDialog } from './confirm-dialog.component';
import type { DecisionAction } from './decision-action.interface';
import { REVIEW_KIT_MESSAGES } from './review-kit.const';

interface DecisionBarProps {
  /** Accessible name of the group (e.g. "Decisão sobre a proposta"). */
  label: string;
  actions: readonly DecisionAction[];
  kicker?: string;
}

/** Row of decision buttons (approve · reject · …); each one confirms in a ConfirmDialog, with reason when needed. */
export function DecisionBar({ label, actions, kicker }: DecisionBarProps) {
  const kit = useText(REVIEW_KIT_MESSAGES);
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
        confirmLabel={open?.label ?? kit.confirm}
        confirmVariant={open?.variant === 'danger' ? 'danger' : 'primary'}
        {...(open?.reason ? { reason: open.reason } : {})}
        onConfirm={(reason) => open?.onConfirm(reason)}
      >
        {open?.confirmBody}
      </ConfirmDialog>
    </div>
  );
}
