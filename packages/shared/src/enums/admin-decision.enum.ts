/** Decision of an admin on a queue item (proposal, dossier). */
export const AdminDecision = {
  Approve: 'approve',
  Reject: 'reject',
} as const;
export type AdminDecision = (typeof AdminDecision)[keyof typeof AdminDecision];
export const ADMIN_DECISION_VALUES = Object.values(AdminDecision) as [AdminDecision, ...AdminDecision[]];
