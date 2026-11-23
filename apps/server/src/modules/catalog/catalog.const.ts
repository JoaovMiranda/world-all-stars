import { CONTENT_SOURCE_LOCALE, DEFAULT_LOCALE, type Locale, WINNING_ACHIEVEMENT_TYPES } from '@was/shared';

/** Content fallback after the requested locale: the data's source language (English), then the interface default. */
export const FALLBACK_CHAIN: readonly Locale[] = [CONTENT_SOURCE_LOCALE, DEFAULT_LOCALE];
/** Placeholder organizer of the prototype: never shown as an association. */
export const UNKNOWN_ORGANIZER_SLUG = 'organizer-not-informed';
export const WINNING = new Set<string>(WINNING_ACHIEVEMENT_TYPES);
/** Flag shown for a historical entity without an emoji (its Commons flag comes via flag_media_link_id later). */
export const HISTORICAL_FLAG = '🏳️';

/** Social network profiles among an athlete's external ids (shown as `social`, never as catalog identifiers). */
export const SOCIAL_PROVIDERS = new Set(['bluesky', 'facebook', 'instagram', 'kick', 'threads', 'tiktok', 'twitch', 'twitter', 'x', 'youtube']);
/** External ids shown elsewhere or internal: Wikidata (own field), Wikipedia titles and pipeline record keys. */
export const HIDDEN_EXTERNAL_ID = /^(wikidata$|wikipedia|key:)/;
/** Slug prefix of the recognition definitions that hold an award (`award--<award slug>`). */
export const AWARD_DEFINITION_PREFIX = 'award--';
/** Recognition kind of an award definition → the award kind the API shows. */
export const AWARD_KIND_OF_RECOGNITION: Record<string, string> = { award: 'individual', hall_of_fame: 'hall_of_fame', ranking_honor: 'ranking' };
/** Recognition levels that are also achievement types (medals); any other level reads as `champion`. */
export const MEDAL_LEVELS = new Set(['gold', 'silver', 'bronze']);

/** Tables whose writes invalidate the cached catalog (participation tables are always queried live). */
export const CATALOG_TABLES = new Set([
  'calendar_days',
  'countries',
  'country_translations',
  'cities',
  'city_translations',
  'competition_levels',
  'champion_tiers',
  'achievement_types',
  'governance_models',
  'governance_model_translations',
  'prize_forms',
  'prize_form_translations',
  'organization_kinds',
  'organization_kind_translations',
  'sport_groups',
  'sport_group_translations',
  'sport_subgroups',
  'sport_subgroup_translations',
  'sports',
  'sport_translations',
  'sport_governing_bodies',
  'sport_collection_reports',
  'organizations',
  'competitions',
  'competition_translations',
  'competition_editions',
  'competition_entries',
  'competition_results',
  'teams',
  'observance_days',
  'observance_day_translations',
  'sources',
  'source_links',
  'media_links',
  'athletes',
  'athlete_translations',
  'athlete_sports',
  'athlete_milestones',
  'athlete_milestone_translations',
  'athlete_tier_history',
  'greats_dossiers',
  'greats_dossier_translations',
  'greats_evidences',
  'greats_evidence_translations',
  'field_provenance',
  'field_conflicts',
  'ingestion_runs',
  'competition_program_sports',
  'sport_relations',
  'domain_values',
  'sport_content_sections',
  'sport_content_section_translations',
  'competitors',
  'competitor_representations',
  'competitor_memberships',
  'competitor_stat_extensions',
  'extension_schemas',
  'recognition_definitions',
  'recognition_definition_translations',
  'recognition_cycles',
  'recognition_grants',
  'title_holdings',
  'category_sets',
  'category_set_translations',
  'entity_external_ids',
  'entity_aliases',
]);
