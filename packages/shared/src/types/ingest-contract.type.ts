import type { z } from 'zod';

import type {
  CompetitionRecordSchema,
  DiscoveredCompetitorSchema,
  EntityRefSchema,
  EntryRecordSchema,
  EventRecordSchema,
  EvidenceRecordSchema,
  ExtensionSchema,
  ObservationSchema,
  ParticipationRecordSchema,
  RecognitionRecordSchema,
  RecordMarkRecordSchema,
  ResultRecordSchema,
  SourceValueSchema,
} from '../schemas/ingest-contract.schema';

export type EntityRef = z.infer<typeof EntityRefSchema>;
export type SourceValue = z.infer<typeof SourceValueSchema>;
export type Extension = z.infer<typeof ExtensionSchema>;
export type DiscoveredCompetitor = z.infer<typeof DiscoveredCompetitorSchema>;
export type CompetitionRecord = z.infer<typeof CompetitionRecordSchema>;
export type EventRecord = z.infer<typeof EventRecordSchema>;
export type EntryRecord = z.infer<typeof EntryRecordSchema>;
export type ParticipationRecord = z.infer<typeof ParticipationRecordSchema>;
export type ResultRecord = z.infer<typeof ResultRecordSchema>;
export type RecognitionRecord = z.infer<typeof RecognitionRecordSchema>;
export type RecordMarkRecord = z.infer<typeof RecordMarkRecordSchema>;
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;
export type Observation = z.infer<typeof ObservationSchema>;
