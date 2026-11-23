import { COMMENT_FLAG_MIN_DISLIKES, DOSSIER_APPROVALS_REQUIRED, PRIVACY_DUE_SOON_DAYS, PRIVACY_RESPONSE_DAYS } from '../consts/admin-rules.const';
import { TIER_SIGNAL_MIN_SHARE, TIER_SIGNAL_MIN_VOTES } from '../consts/tier-vote.const';
import { CommentStatus } from '../enums/comment-status.enum';
import { PrivacyRequestStatus } from '../enums/privacy-request-status.enum';
import { TIER_VALUES, type Tier } from '../enums/tier.enum';
import type { TierSignalResult } from '../interfaces/tier-signal-result.interface';
import type { PrivacyDeadline } from '../types/privacy-deadline.type';

const DAY_MS = 86_400_000;

/** Tier signal of an athlete (doc 17): most-voted tier differs from the official, ≥ 30 votes, > 60 % share. */
export const tierSignalOf = (counts: Partial<Record<Tier, number>>, official: Tier): TierSignalResult => {
  const total = TIER_VALUES.reduce((s, t) => s + (counts[t] ?? 0), 0);
  let topOther: Tier | null = null;
  for (const t of TIER_VALUES) if (t !== official && (counts[t] ?? 0) > 0 && (topOther === null || (counts[t] ?? 0) > (counts[topOther] ?? 0))) topOther = t;
  const otherVotes = topOther ? (counts[topOther] ?? 0) : 0;
  const topOtherShare = total ? otherVotes / total : 0;
  const mostVoted = total === 0 ? null : topOther && otherVotes > (counts[official] ?? 0) ? topOther : official;
  return { topOther, topOtherShare, mostVoted, isSignal: total >= TIER_SIGNAL_MIN_VOTES && topOtherShare > TIER_SIGNAL_MIN_SHARE };
};

/** A7: a visible comment with many dislikes needs a moderator look (doc 20). */
export const isCommentFlagged = (comment: { status: CommentStatus; dislikes: number }): boolean =>
  comment.status === CommentStatus.Visible && comment.dislikes >= COMMENT_FLAG_MIN_DISLIKES;

/** A5: legal deadline of a privacy request created at `createdAt` (ISO datetime). */
export const privacyDueAt = (createdAt: string): string => new Date(new Date(createdAt).getTime() + PRIVACY_RESPONSE_DAYS * DAY_MS).toISOString();

/** A5: where a request stands against its deadline (closed requests never become late). */
export const privacyDeadlineOf = (
  request: { status: PrivacyRequestStatus; dueAt: string },
  now: Date = new Date(),
): { state: PrivacyDeadline; daysLeft: number } => {
  const daysLeft = Math.ceil((new Date(request.dueAt).getTime() - now.getTime()) / DAY_MS);
  if (request.status === PrivacyRequestStatus.Answered || request.status === PrivacyRequestStatus.Rejected) return { state: 'closed', daysLeft };
  if (daysLeft < 0) return { state: 'overdue', daysLeft };
  return { state: daysLeft <= PRIVACY_DUE_SOON_DAYS ? 'due_soon' : 'on_track', daysLeft };
};

/** A6: a dossier is published once it has the required approvals from different admins. */
export const isDossierApproved = (approvedBy: readonly string[], required: number = DOSSIER_APPROVALS_REQUIRED): boolean =>
  new Set(approvedBy).size >= required;
