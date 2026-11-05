/** Nature of an organization (doc 19). */
export const OrgNature = {
  Association: 'association',
  Company: 'company',
  Brand: 'brand',
  Media: 'media',
  Community: 'community',
  Unknown: 'unknown',
} as const;
export type OrgNature = (typeof OrgNature)[keyof typeof OrgNature];
export const ORG_NATURE_VALUES = Object.values(OrgNature) as [OrgNature, ...OrgNature[]];
