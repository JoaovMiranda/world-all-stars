import { z } from 'zod';

import { COMPETITION_LEVEL_VALUES } from '../enums/competition-level.enum';
import { ORG_NATURE_VALUES } from '../enums/org-nature.enum';
import { ORG_RELATION_VALUES } from '../enums/org-relation.enum';
import { CountryRefSchema } from './country-ref.schema';
import { SportInfoSchema } from './sport-ref.schema';

/** Organization (doc 19): kind, nature, relation to its parent, scope, Wikipedia link and logo by link. */
export const OrganizationSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  kind: z.string().min(1),
  kindLabel: z.string().min(1),
  nature: z.enum(ORG_NATURE_VALUES),
  natureLabel: z.string().min(1),
  relation: z.enum(ORG_RELATION_VALUES).nullable(),
  relationLabel: z.string().nullable(),
  scope: z.enum(COMPETITION_LEVEL_VALUES),
  country: CountryRefSchema.nullable(),
  competitions: z.array(z.object({ name: z.string().min(1), sport: z.string().min(1) })),
  sports: z.array(SportInfoSchema.extend({ role: z.string().min(1) })),
  wikipedia: z.url().nullable(),
  image: z.url().nullable(),
  description: z.string().nullable(),
  qid: z.string().nullable(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

/** One step of the hierarchy up to the root (FIFA › CONMEBOL › CBF). */
export const OrgChainItemSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  wikipedia: z.url().nullable(),
  relationLabel: z.string().nullable(),
});
export type OrgChainItem = z.infer<typeof OrgChainItemSchema>;

/** Organization as an association of a sport: roles in that sport + chain up to the root. */
export const SportAssociationSchema = OrganizationSchema.extend({
  roles: z.array(z.string().min(1)),
  governs: z.boolean(),
  chain: z.array(OrgChainItemSchema),
});
export type SportAssociation = z.infer<typeof SportAssociationSchema>;

export type OrgTreeNode = Organization & { children: OrgTreeNode[] };
/** Node of GET /api/organizations (full hierarchy, recursive). */
export const OrgTreeNodeSchema: z.ZodType<OrgTreeNode> = OrganizationSchema.extend({
  get children() {
    return z.array(OrgTreeNodeSchema);
  },
});
