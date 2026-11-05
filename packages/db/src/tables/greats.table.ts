// "Mudou o jogo" dossiers of the Hall of Greats: evidences with sources + approvals by 2 different admins.
import { integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import { dossierStatusEnum } from '../columns/pg-enum.column';
import { athletes } from './athlete.table';
import { sourceLinks } from './source.table';
import { users } from './user.table';

export const greatsDossiers = pgTable(
  'greats_dossiers',
  {
    ...baseColumns(),
    athleteId: uuid().notNull().references(() => athletes.id),
    status: dossierStatusEnum().notNull().default('draft'),
    approvalsRequired: integer().notNull().default(2),
    approvalsCount: integer().notNull().default(0),
    reviewNote: text(),
  },
  (t) => [uniqueIndex().on(t.athleteId).where(live(t.deletedAt))],
);
export const greatsDossierTranslations = pgTable(
  'greats_dossier_translations',
  { ...baseColumns(), dossierId: uuid().notNull().references(() => greatsDossiers.id), locale: text().notNull(), headline: text().notNull() },
  (t) => [uniqueIndex().on(t.dossierId, t.locale).where(live(t.deletedAt))],
);

export const greatsEvidences = pgTable('greats_evidences', {
  ...baseColumns(),
  dossierId: uuid().notNull().references(() => greatsDossiers.id),
  evidenceType: text().notNull(),
  sourceLinkId: uuid().references(() => sourceLinks.id),
});
export const greatsEvidenceTranslations = pgTable(
  'greats_evidence_translations',
  { ...baseColumns(), evidenceId: uuid().notNull().references(() => greatsEvidences.id), locale: text().notNull(), description: text() },
  (t) => [uniqueIndex().on(t.evidenceId, t.locale).where(live(t.deletedAt))],
);

/** One approval of a dossier (the same admin cannot approve twice). */
export const greatsDossierApprovals = pgTable(
  'greats_dossier_approvals',
  { ...baseColumns(), dossierId: uuid().notNull().references(() => greatsDossiers.id), adminUserId: uuid().notNull().references(() => users.id), reason: text() },
  (t) => [uniqueIndex().on(t.dossierId, t.adminUserId).where(live(t.deletedAt))],
);
