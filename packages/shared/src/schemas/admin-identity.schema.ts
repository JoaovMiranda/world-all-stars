// Identity review queue (handoff v3 §7.1, Fase 6): observations whose competitor could not be matched automatically.
import { z } from 'zod';

export const IDENTITY_DECISION_VALUES = ['match', 'create', 'reject'] as const;
export const IDENTITY_STATUS_VALUES = ['pending', 'matched', 'created', 'duplicate', 'rejected'] as const;

export const IdentityCandidateRefSchema = z.object({ id: z.string().min(1), name: z.string().min(1), slug: z.string().min(1), confidence: z.number() });
export const AdminIdentityCandidateSchema = z.object({
  id: z.string().min(1),
  discoveredName: z.string().min(1),
  sport: z.string().nullable(),
  externalIds: z.record(z.string(), z.string()),
  confidence: z.number(),
  status: z.enum(IDENTITY_STATUS_VALUES),
  candidates: z.array(IdentityCandidateRefSchema),
  provider: z.string().min(1),
  documentUrl: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export const AdminIdentitiesResponseSchema = z.object({ items: z.array(AdminIdentityCandidateSchema) });

export const DecideIdentityRequestSchema = z.object({
  decision: z.enum(IDENTITY_DECISION_VALUES),
  /** Required for `match`: the competitor the observation is. */
  entityId: z.string().min(1).optional(),
  reason: z.string().trim().min(3).max(500),
});
