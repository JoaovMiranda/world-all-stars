import type { z } from 'zod';

import type { OrganizationSchema, OrgChainItemSchema, SportAssociationSchema } from '../schemas/organization.schema';

export type Organization = z.infer<typeof OrganizationSchema>;
export type OrgChainItem = z.infer<typeof OrgChainItemSchema>;
export type SportAssociation = z.infer<typeof SportAssociationSchema>;
export type OrgTreeNode = Organization & { children: OrgTreeNode[] };
