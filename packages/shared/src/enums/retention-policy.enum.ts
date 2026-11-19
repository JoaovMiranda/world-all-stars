/** What of a fetched document may be stored (B05). */
export const RetentionPolicy = {
  MetadataOnly: 'metadata_only',
  EvidenceExcerpts: 'evidence_excerpts',
  FullPayload: 'full_payload',
} as const;
export type RetentionPolicy = (typeof RetentionPolicy)[keyof typeof RetentionPolicy];
export const RETENTION_POLICY_VALUES = Object.values(RetentionPolicy) as [RetentionPolicy, ...RetentionPolicy[]];
