import { DEFAULT_LOCALE, type Locale } from '../i18n/locale.const';
import { textFor } from '../i18n/messages.helper';
import { API_ERROR_MESSAGES } from '../consts/api-error-messages.const';
import { AdminDecision } from '../enums/admin-decision.enum';
import { ApiErrorCode } from '../enums/api-error-code.enum';
import { DossierStatus } from '../enums/dossier-status.enum';
import { Tier } from '../enums/tier.enum';
import { isDossierApproved } from './admin-rules.helper';

type RuleError = { error: ApiErrorCode; message: string };

/** Official tier change (doc 17): Mythic only with an approved dossier; the same tier is refused. Null = allowed. */
export const officialTierChangeError = (change: { current: Tier; target: Tier; dossierStatus: DossierStatus | null }, locale: Locale = DEFAULT_LOCALE): RuleError | null => {
  const m = textFor(API_ERROR_MESSAGES, locale);
  if (change.target === Tier.Mythic && change.dossierStatus !== DossierStatus.Approved) {
    return { error: ApiErrorCode.DossierRequired, message: m.mythicNeedsDossier };
  }
  if (change.target === change.current) return { error: ApiErrorCode.SameTier, message: m.sameTier };
  return null;
};

/**
 * Review of a "Mudou o jogo" dossier (A6): two approvals from DIFFERENT admins publish it, one rejection closes it.
 * Returns the new state or the rule error.
 */
export const reviewDossierOutcome = (
  dossier: { status: DossierStatus; approvedBy: readonly string[]; approvalsRequired: number },
  decision: AdminDecision,
  reviewer: string,
  locale: Locale = DEFAULT_LOCALE,
): { ok: true; status: DossierStatus; approvedBy: string[] } | ({ ok: false } & RuleError) => {
  const m = textFor(API_ERROR_MESSAGES, locale);
  if (dossier.status !== DossierStatus.Pending && dossier.status !== DossierStatus.Draft) {
    return { ok: false, error: ApiErrorCode.AlreadyDecided, message: m.dossierDecided };
  }
  if (decision === AdminDecision.Reject) return { ok: true, status: DossierStatus.Rejected, approvedBy: [...dossier.approvedBy] };
  if (dossier.approvedBy.includes(reviewer)) return { ok: false, error: ApiErrorCode.AlreadyDecided, message: m.dossierAlreadyApproved };
  const approvedBy = [...dossier.approvedBy, reviewer];
  return { ok: true, status: isDossierApproved(approvedBy, dossier.approvalsRequired) ? DossierStatus.Approved : DossierStatus.Pending, approvedBy };
};
