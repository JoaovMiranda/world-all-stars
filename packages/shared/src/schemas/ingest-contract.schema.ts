// General ingestion contracts (handoff v3 §6.2): small, stable and versioned. Providers and parsers produce ONLY these
// records; sport-specific details travel in `extension` under a registered schema key (never free JSON).
import { z } from 'zod';

import { COMPETITOR_KIND_VALUES } from '../enums/competitor-kind.enum';
import { INFORMATION_KIND_VALUES } from '../enums/information-kind.enum';

/** Reference to an entity by a natural key the identity resolver understands (never a database id). */
export const EntityRefSchema = z.object({
  /** Stable key inside the source document, e.g. `wc-2002/BRA/player:Ronaldo`. */
  recordKey: z.string().min(1),
  name: z.string().min(1),
  externalIds: z.record(z.string(), z.string()).default({}),
});

/** A value exactly as the source wrote it, plus its normalized form (units are never lost). */
export const SourceValueSchema = z.object({
  original: z.string().min(1),
  value: z.union([z.number(), z.string(), z.boolean()]).nullable(),
  unit: z.string().nullable().default(null),
});

/** Registered, versioned extension (`bout.v1`, `chess-game.v1`…): validated against the extension registry. */
export const ExtensionSchema = z.object({ key: z.string().regex(/^[a-z0-9-]+\.v\d+$/), data: z.record(z.string(), z.unknown()) });

const evidence = z.object({ quote: z.string().min(1).nullable().default(null), section: z.string().nullable().default(null) });

export const DiscoveredCompetitorSchema = EntityRefSchema.extend({
  kind: z.enum(COMPETITOR_KIND_VALUES),
  /** Sport slug(s) the competitor is known for. */
  sports: z.array(z.string()).default([]),
  aliases: z.array(z.object({ name: z.string().min(1), kind: z.string().min(1), locale: z.string().nullable().default(null) })).default([]),
  /** Members of a team or group (pairs, crews, relay teams). */
  members: z.array(z.object({ person: EntityRefSchema, role: z.string().nullable().default(null) })).default([]),
  birthDate: z.string().nullable().default(null),
  gender: z.enum(['male', 'female', 'unknown']).nullable().default(null),
});

export const CompetitionRecordSchema = z.object({
  competition: EntityRefSchema,
  sport: z.string().min(1),
  organization: EntityRefSchema.nullable().default(null),
  edition: z
    .object({ label: z.string().nullable().default(null), year: z.number().int().nullable().default(null), kind: z.string().default('edition') })
    .nullable()
    .default(null),
  stage: z
    .object({ label: z.string().min(1), kind: z.string().min(1), order: z.number().int().default(0) })
    .nullable()
    .default(null),
});

export const EventRecordSchema = CompetitionRecordSchema.extend({
  event: z.object({
    label: z.string().min(1),
    /** Discipline slug when different from the sport. */
    discipline: z.string().nullable().default(null),
    format: z.string().min(1),
    composition: z.string().min(1),
    /** Category values by dimension slug, e.g. { sex_category: 'women', weight: '-57kg' }. */
    categories: z.record(z.string(), z.string()).default({}),
  }),
});

export const EntryRecordSchema = z.object({
  event: EventRecordSchema,
  competitor: DiscoveredCompetitorSchema,
  representation: EntityRefSchema.nullable().default(null),
  status: z.string().default('registered'),
  members: z
    .array(
      z.object({
        person: EntityRefSchema,
        role: z.string().nullable().default(null),
        status: z.string().default('registered'),
        appearance: z.string().default('unknown'),
        shirtNumber: z.number().int().nullable().default(null),
      }),
    )
    .default([]),
});

export const ParticipationRecordSchema = z.object({
  event: EventRecordSchema,
  contest: z.object({ label: z.string().min(1), sequence: z.number().int().default(0), date: z.string().nullable().default(null) }),
  competitor: EntityRefSchema,
  person: EntityRefSchema,
  role: z.string().min(1),
});

export const ResultRecordSchema = z.object({
  event: EventRecordSchema,
  competitor: DiscoveredCompetitorSchema,
  rank: z.number().int().positive().nullable().default(null),
  tied: z.boolean().default(false),
  status: z.string().default('finished'),
  metrics: z.record(z.string(), SourceValueSchema).default({}),
  extension: ExtensionSchema.nullable().default(null),
});

export const RecognitionRecordSchema = z.object({
  /** recognition_kind slug: championship_title, medal, award, belt_title, record, hall_of_fame, traditional_honor… */
  kind: z.string().min(1),
  definition: EntityRefSchema,
  issuer: EntityRefSchema.nullable().default(null),
  competitor: DiscoveredCompetitorSchema,
  year: z.number().int().nullable().default(null),
  level: z.string().nullable().default(null),
  cycle: z.string().nullable().default(null),
  /** When the recognition derives from a result (champion → title, gold → medal). */
  result: ResultRecordSchema.nullable().default(null),
  status: z.string().default('granted'),
});

export const RecordMarkRecordSchema = z.object({
  definition: EntityRefSchema,
  competitor: DiscoveredCompetitorSchema,
  metric: z.string().min(1),
  value: SourceValueSchema,
  date: z.string().nullable().default(null),
  conditions: z.record(z.string(), SourceValueSchema).default({}),
  ratification: z.string().default('ratified'),
});

export const EvidenceRecordSchema = z.object({
  informationKind: z.enum(INFORMATION_KIND_VALUES),
  field: z.string().min(1),
  value: SourceValueSchema,
  evidence,
});

/** One observation produced by a parser: the envelope stored in source_observations.extracted. */
export const ObservationSchema = z.discriminatedUnion('contract', [
  z.object({ contract: z.literal('competitor'), record: DiscoveredCompetitorSchema }),
  z.object({ contract: z.literal('entry'), record: EntryRecordSchema }),
  z.object({ contract: z.literal('participation'), record: ParticipationRecordSchema }),
  z.object({ contract: z.literal('result'), record: ResultRecordSchema }),
  z.object({ contract: z.literal('recognition'), record: RecognitionRecordSchema }),
  z.object({ contract: z.literal('record_mark'), record: RecordMarkRecordSchema }),
  z.object({ contract: z.literal('evidence'), record: EvidenceRecordSchema }),
]);
