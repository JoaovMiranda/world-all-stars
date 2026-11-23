import { z } from 'zod';

import { COMMENT_STATUS_VALUES } from '../enums/comment-status.enum';
import { CONTACT_STATUS_VALUES } from '../enums/contact-status.enum';
import { CONTACT_TOPIC_VALUES } from '../enums/contact-topic.enum';
import { INGESTION_GATE_VALUES } from '../enums/ingestion-gate.enum';
import { REVIEW_STATUS_VALUES } from '../enums/review-status.enum';
import { SUGGESTION_STATUS_VALUES } from '../enums/suggestion-status.enum';
import { AthleteRefSchema } from './athlete-summary.schema';
import { BannedWordSchema } from './moderation-rules.schema';
import { IngestionRunSchema } from './source-overview.schema';
import { SourceRefSchema } from './source-ref.schema';

/** A3/A1 · Proposal produced by crawlers or the local AI (users never propose edits, doc 20). */
export const CrawlerProposalSchema = z.object({
  id: z.string().min(1),
  origin: z.enum(['field_conflict', 'ai_extraction']),
  entity: z.object({ type: z.string().min(1), id: z.string().min(1), label: z.string().min(1) }),
  field: z.string().min(1),
  /** Value when the proposal was created (3-way diff base · current · proposed, doc 03). */
  base: z.string().nullable().default(null),
  current: z.string().nullable(),
  proposed: z.string().nullable(),
  source: SourceRefSchema.nullable(),
  /** Verbatim excerpt that supports an AI-extracted value (doc 11). */
  evidenceQuote: z.string().nullable(),
  extractedByAi: z.boolean(),
  /** Model that extracted the value (AI proposals). */
  model: z.string().nullable().default(null),
  status: z.enum(REVIEW_STATUS_VALUES),
  /** Reason written by the admin who decided. */
  reviewNote: z.string().nullable().default(null),
  /** Gate that skipped the item (no change, noise, parser, duplicate, budget). */
  skippedAtGate: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export const CrawlerProposalsResponseSchema = z.object({ items: z.array(CrawlerProposalSchema) });

/** A2 · Ingestion runs with their source, items skipped per gate, extractor tokens and log lines. */
export const AdminIngestionRunSchema = IngestionRunSchema.extend({
  source: z.object({ slug: z.string().min(1), name: z.string().min(1) }).nullable(),
  skipped: z.record(z.enum(INGESTION_GATE_VALUES), z.number().int().nonnegative()).default({ unchanged: 0, noise: 0, parser: 0, duplicate: 0, budget: 0 }),
  tokens: z.number().int().nonnegative().default(0),
  logs: z.array(z.object({ at: z.iso.datetime(), level: z.enum(['info', 'warn', 'error']), message: z.string() })).default([]),
});
/** A2 · `ai_extraction_queue` item (doc 11). */
export const AiQueueItemSchema = z.object({
  id: z.string().min(1),
  entityLabel: z.string().min(1),
  section: z.string().min(1),
  sourceName: z.string().nullable(),
  status: z.string().min(1),
  skippedAtGate: z.enum(INGESTION_GATE_VALUES).nullable(),
  tokensIn: z.number().int().nonnegative(),
  tokensOut: z.number().int().nonnegative(),
  model: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export const AdminIngestionResponseSchema = z.object({
  runs: z.array(AdminIngestionRunSchema),
  queue: z.array(AiQueueItemSchema).default([]),
});

/** A7 · Comments for moderation (most disliked first) + banned words list. */
export const AdminCommentSchema = z.object({
  id: z.string().min(1),
  athlete: AthleteRefSchema,
  author: z.string().min(1),
  body: z.string(),
  at: z.iso.datetime(),
  likes: z.number().int().nonnegative(),
  dislikes: z.number().int().nonnegative(),
  replies: z.number().int().nonnegative(),
  status: z.enum(COMMENT_STATUS_VALUES),
  hiddenReason: z.string().nullable(),
});
export const AdminCommentsResponseSchema = z.object({ items: z.array(AdminCommentSchema), bannedWords: z.array(BannedWordSchema) });
export const ModerateCommentRequestSchema = z.object({ status: z.enum(COMMENT_STATUS_VALUES), reason: z.string().trim().min(3) });

/** A8 · Athlete suggestions and contact inbox. */
export const AdminSuggestionSchema = z.object({
  id: z.string().min(1),
  protocol: z.string().min(1),
  athleteName: z.string().min(1),
  sport: z.string().nullable(),
  urls: z.array(z.url()),
  why: z.string().nullable(),
  email: z.string().nullable(),
  status: z.enum(SUGGESTION_STATUS_VALUES),
  createdAt: z.iso.datetime(),
});
export const AdminContactMessageSchema = z.object({
  id: z.string().min(1),
  protocol: z.string().min(1),
  name: z.string().min(1),
  email: z.string().min(3),
  topic: z.enum(CONTACT_TOPIC_VALUES),
  body: z.string(),
  status: z.enum(CONTACT_STATUS_VALUES),
  createdAt: z.iso.datetime(),
});
export const AdminInboxResponseSchema = z.object({ suggestions: z.array(AdminSuggestionSchema), messages: z.array(AdminContactMessageSchema) });
export const ReviewSuggestionRequestSchema = z.object({ status: z.enum(SUGGESTION_STATUS_VALUES), note: z.string().optional() });
