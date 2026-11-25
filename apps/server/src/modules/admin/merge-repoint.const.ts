import type { MergeRepointTable } from './merge-repoint-table.interface';

/**
 * Every table/column that points at a competitor id and must follow the survivor when two competitors are merged
 * (T1.3, D14): entries, members, participations, results, grants, holdings, aliases, external ids, representations,
 * votes, comments, provenance… Ids are global (one entity_registry row per entity), so polymorphic tables need no
 * entity-type filter. Tables missing from the current schema are skipped at run time (legacy tables are being
 * dropped). History tables (`entity_versions`, `entity_merges`, `audit_logs`) are never re-pointed: a merge records
 * itself instead of rewriting history.
 */
export const MERGE_REPOINT_TABLES: readonly MergeRepointTable[] = [
  // Legacy athlete tables (until T1.2 drops them).
  { table: 'athlete_sports', column: 'athlete_id' },
  { table: 'athlete_translations', column: 'athlete_id' },
  { table: 'athlete_milestones', column: 'athlete_id' },
  { table: 'athlete_tier_history', column: 'athlete_id' },
  { table: 'greats_dossiers', column: 'athlete_id' },
  { table: 'athlete_suggestions', column: 'existing_athlete_id' },
  // Participation: votes and comments.
  { table: 'tier_votes', column: 'athlete_id' },
  { table: 'comments', column: 'athlete_id' },
  // Universal model: entries, members, participations, results, grants, holdings, records, rankings.
  { table: 'competitor_memberships', column: 'member_id' },
  { table: 'competitor_memberships', column: 'parent_id' },
  { table: 'competitor_representations', column: 'competitor_id' },
  { table: 'competition_entries', column: 'competitor_id' },
  { table: 'entry_members', column: 'person_id' },
  { table: 'contest_participations', column: 'person_id' },
  { table: 'competitor_stat_snapshots', column: 'competitor_id' },
  { table: 'recognition_grants', column: 'competitor_id' },
  { table: 'recognition_grants', column: 'via_competitor_id' },
  { table: 'title_holdings', column: 'competitor_id' },
  { table: 'record_marks', column: 'competitor_id' },
  { table: 'ranking_entries', column: 'competitor_id' },
  // Registry: aliases, external ids, relations, roles, old-slug redirects.
  { table: 'entity_aliases', column: 'entity_id' },
  { table: 'entity_external_ids', column: 'entity_id' },
  { table: 'entity_relations', column: 'from_id' },
  { table: 'entity_relations', column: 'to_id' },
  { table: 'organization_roles', column: 'target_id' },
  { table: 'slug_redirects', column: 'entity_id' },
  // Sources and provenance.
  { table: 'source_links', column: 'entity_id' },
  { table: 'source_observations', column: 'entity_id' },
  { table: 'field_provenance', column: 'entity_id' },
  { table: 'field_conflicts', column: 'entity_id' },
  { table: 'identity_candidates', column: 'proposed_entity_id' },
];
