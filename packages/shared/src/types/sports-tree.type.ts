import type { z } from 'zod';

import type { GovernanceModelSchema, SportCardSchema, SportGroupSchema } from '../schemas/sports-tree.schema';

export type SportCard = z.infer<typeof SportCardSchema>;
export type SportGroup = z.infer<typeof SportGroupSchema>;
export type GovernanceModelInfo = z.infer<typeof GovernanceModelSchema>;
