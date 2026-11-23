import type { ReactNode } from 'react';
import type { ButtonVariant } from './button-variant.type';
import type { ReasonConfig } from './reason-config.interface';

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
