/** Relation of an organization to its parent (doc 19). */
export const OrgRelation = {
  MemberOf: 'member_of',
  RecognizedBy: 'recognized_by',
  LicensedBy: 'licensed_by',
  OwnedBy: 'owned_by',
  AffiliatedTo: 'affiliated_to',
} as const;
export type OrgRelation = (typeof OrgRelation)[keyof typeof OrgRelation];
export const ORG_RELATION_VALUES = Object.values(OrgRelation) as [OrgRelation, ...OrgRelation[]];
