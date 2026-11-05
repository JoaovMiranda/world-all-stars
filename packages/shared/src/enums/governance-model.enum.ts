/** Governance models of sports (doc 18). */
export const GovernanceModel = {
  Pyramid: 'pyramid',
  Condominium: 'condominium',
  FreeMarket: 'free_market',
  Publisher: 'publisher',
  Cultural: 'cultural',
} as const;
export type GovernanceModel = (typeof GovernanceModel)[keyof typeof GovernanceModel];
export const GOVERNANCE_MODEL_VALUES = Object.values(GovernanceModel) as [GovernanceModel, ...GovernanceModel[]];
