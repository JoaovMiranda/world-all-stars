// Postgres enums created FROM the shared enums (doc 07): the same values validate the API (Zod) and the database.
import {
  AI_INVOCATION_STATUS_VALUES,
  COMPETITOR_KIND_VALUES,
  CONTENT_SECTION_STATUS_VALUES,
  COUNTRY_KIND_VALUES,
  CRAWL_POLICY_VALUES,
  DIMENSION_VALUE_TYPE_VALUES,
  DOMAIN_KIND_VALUES,
  ENTITY_TYPE_VALUES,
  GENDER_VALUES,
  INFORMATION_KIND_VALUES,
  JOB_ITEM_STATUS_VALUES,
  METRIC_DIRECTION_VALUES,
  METRIC_VALUE_TYPE_VALUES,
  PROFILE_VISIBILITY_VALUES,
  PROVENANCE_REVIEW_STATUS_VALUES,
  RANKING_OUTPUT_KIND_VALUES,
  RANKING_SNAPSHOT_STATUS_VALUES,
  RETENTION_POLICY_VALUES,
  ATHLETE_STATUS_VALUES,
  BANNED_WORD_MATCH_MODE_VALUES,
  COMMENT_REACTION_VALUES,
  COMMENT_STATUS_VALUES,
  COMPETITION_LEVEL_VALUES,
  COMPETITION_STATUS_VALUES,
  CONSENT_PURPOSE_VALUES,
  CONTACT_STATUS_VALUES,
  CONTACT_TOPIC_VALUES,
  DOSSIER_STATUS_VALUES,
  GOVERNANCE_MODEL_VALUES,
  INGESTION_RUN_STATUS_VALUES,
  LEGAL_DOCUMENT_KIND_VALUES,
  NOTIFICATION_KIND_VALUES,
  OBSERVANCE_RECOGNITION_VALUES,
  OBSERVANCE_SCOPE_VALUES,
  ON_THIS_DAY_KIND_VALUES,
  ORG_NATURE_VALUES,
  ORG_RELATION_VALUES,
  PRIVACY_REQUEST_STATUS_VALUES,
  PRIVACY_RIGHT_VALUES,
  PRIVACY_SUBJECT_KIND_VALUES,
  SOURCE_ORIGIN_KIND_VALUES,
  SOURCE_USAGE_STATUS_VALUES,
  SUGGESTION_STATUS_VALUES,
  TIER_VALUES,
  TIER_VOTE_FLAG_STATUS_VALUES,
  USER_ROLE_VALUES,
} from '@was/shared';
import { pgEnum } from 'drizzle-orm/pg-core';

export const athleteStatusEnum = pgEnum('athlete_status', ATHLETE_STATUS_VALUES);
export const bannedWordMatchModeEnum = pgEnum('banned_word_match_mode', BANNED_WORD_MATCH_MODE_VALUES);
export const commentReactionEnum = pgEnum('comment_reaction', COMMENT_REACTION_VALUES);
export const commentStatusEnum = pgEnum('comment_status', COMMENT_STATUS_VALUES);
export const competitionLevelEnum = pgEnum('competition_level', COMPETITION_LEVEL_VALUES);
export const competitionStatusEnum = pgEnum('competition_status', COMPETITION_STATUS_VALUES);
export const consentPurposeEnum = pgEnum('consent_purpose', CONSENT_PURPOSE_VALUES);
export const contactStatusEnum = pgEnum('contact_status', CONTACT_STATUS_VALUES);
export const contactTopicEnum = pgEnum('contact_topic', CONTACT_TOPIC_VALUES);
export const dossierStatusEnum = pgEnum('dossier_status', DOSSIER_STATUS_VALUES);
export const governanceModelEnum = pgEnum('governance_model', GOVERNANCE_MODEL_VALUES);
export const ingestionRunStatusEnum = pgEnum('ingestion_run_status', INGESTION_RUN_STATUS_VALUES);
export const legalDocumentKindEnum = pgEnum('legal_document_kind', LEGAL_DOCUMENT_KIND_VALUES);
export const notificationKindEnum = pgEnum('notification_kind', NOTIFICATION_KIND_VALUES);
export const observanceRecognitionEnum = pgEnum('observance_recognition', OBSERVANCE_RECOGNITION_VALUES);
export const observanceScopeEnum = pgEnum('observance_scope', OBSERVANCE_SCOPE_VALUES);
export const milestoneKindEnum = pgEnum('milestone_kind', ON_THIS_DAY_KIND_VALUES);
export const orgNatureEnum = pgEnum('org_nature', ORG_NATURE_VALUES);
export const orgRelationEnum = pgEnum('org_relation', ORG_RELATION_VALUES);
export const privacyRequestStatusEnum = pgEnum('privacy_request_status', PRIVACY_REQUEST_STATUS_VALUES);
export const privacyRightEnum = pgEnum('privacy_right', PRIVACY_RIGHT_VALUES);
export const privacySubjectKindEnum = pgEnum('privacy_subject_kind', PRIVACY_SUBJECT_KIND_VALUES);
export const sourceOriginKindEnum = pgEnum('source_origin_kind', SOURCE_ORIGIN_KIND_VALUES);
export const sourceUsageStatusEnum = pgEnum('source_usage_status', SOURCE_USAGE_STATUS_VALUES);
export const suggestionStatusEnum = pgEnum('suggestion_status', SUGGESTION_STATUS_VALUES);
export const tierEnum = pgEnum('tier', TIER_VALUES);
export const userRoleEnum = pgEnum('user_role', USER_ROLE_VALUES);

// Handoff v3: stable internal states only (competitive values are domain data, see tables/domain.table.ts).
export const aiInvocationStatusEnum = pgEnum('ai_invocation_status', AI_INVOCATION_STATUS_VALUES);
export const competitorKindEnum = pgEnum('competitor_kind', COMPETITOR_KIND_VALUES);
export const contentSectionStatusEnum = pgEnum('content_section_status', CONTENT_SECTION_STATUS_VALUES);
export const countryKindEnum = pgEnum('country_kind', COUNTRY_KIND_VALUES);
export const crawlPolicyEnum = pgEnum('crawl_policy', CRAWL_POLICY_VALUES);
export const dimensionValueTypeEnum = pgEnum('dimension_value_type', DIMENSION_VALUE_TYPE_VALUES);
export const domainKindEnum = pgEnum('domain_kind', DOMAIN_KIND_VALUES);
export const entityTypeEnum = pgEnum('entity_type', ENTITY_TYPE_VALUES);
export const genderEnum = pgEnum('gender', GENDER_VALUES);
export const informationKindEnum = pgEnum('information_kind', INFORMATION_KIND_VALUES);
export const jobItemStatusEnum = pgEnum('job_item_status', JOB_ITEM_STATUS_VALUES);
export const metricDirectionEnum = pgEnum('metric_direction', METRIC_DIRECTION_VALUES);
export const metricValueTypeEnum = pgEnum('metric_value_type', METRIC_VALUE_TYPE_VALUES);
export const profileVisibilityEnum = pgEnum('profile_visibility', PROFILE_VISIBILITY_VALUES);
export const provenanceReviewStatusEnum = pgEnum('provenance_review_status', PROVENANCE_REVIEW_STATUS_VALUES);
export const rankingOutputKindEnum = pgEnum('ranking_output_kind', RANKING_OUTPUT_KIND_VALUES);
export const rankingSnapshotStatusEnum = pgEnum('ranking_snapshot_status', RANKING_SNAPSHOT_STATUS_VALUES);
export const retentionPolicyEnum = pgEnum('retention_policy', RETENTION_POLICY_VALUES);
export const tierVoteFlagStatusEnum = pgEnum('tier_vote_flag_status', TIER_VOTE_FLAG_STATUS_VALUES);
