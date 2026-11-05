/** Status of a "Mudou o jogo" dossier (Hall of Greats). */
export const DossierStatus = {
  Draft: 'draft',
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
} as const;
export type DossierStatus = (typeof DossierStatus)[keyof typeof DossierStatus];
export const DOSSIER_STATUS_VALUES = Object.values(DossierStatus) as [DossierStatus, ...DossierStatus[]];
