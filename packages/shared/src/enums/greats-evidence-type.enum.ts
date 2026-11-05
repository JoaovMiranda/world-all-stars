/** Kind of evidence of a "Mudou o jogo" dossier (doc 03). */
export const GreatsEvidenceType = {
  TechniqueNamed: 'technique_named',
  DecadesRecord: 'decades_record',
  RuleOrMarketChange: 'rule_or_market_change',
  GlobalPopularization: 'global_popularization',
  InstitutionalRecognition: 'institutional_recognition',
  Other: 'other',
} as const;
export type GreatsEvidenceType = (typeof GreatsEvidenceType)[keyof typeof GreatsEvidenceType];
export const GREATS_EVIDENCE_TYPE_VALUES = Object.values(GreatsEvidenceType) as [GreatsEvidenceType, ...GreatsEvidenceType[]];
