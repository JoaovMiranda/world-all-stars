import type { z } from 'zod';

import type { AdminIdentitiesResponseSchema, AdminIdentityCandidateSchema, DecideIdentityRequestSchema } from '../schemas/admin-identity.schema';

export type AdminIdentityCandidate = z.infer<typeof AdminIdentityCandidateSchema>;
export type AdminIdentitiesResponse = z.infer<typeof AdminIdentitiesResponseSchema>;
export type DecideIdentityRequest = z.infer<typeof DecideIdentityRequestSchema>;
