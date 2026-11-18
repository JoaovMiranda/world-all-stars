// Public API of @was/shared (the only barrel of the package). Keep sections sorted; one export per file.

// Enums
export * from './enums/achievement-kind.enum';
export * from './enums/achievement-type.enum';
export * from './enums/admin-audit-action.enum';
export * from './enums/admin-decision.enum';
export * from './enums/admin-section.enum';
export * from './enums/admin-tab.enum';
export * from './enums/api-access.enum';
export * from './enums/api-error-code.enum';
export * from './enums/athlete-profile-tab.enum';
export * from './enums/athlete-status.enum';
export * from './enums/auth-audit-action.enum';
export * from './enums/banned-word-match-mode.enum';
export * from './enums/calendar-event-type.enum';
export * from './enums/comment-reaction.enum';
export * from './enums/comment-sort.enum';
export * from './enums/comment-status.enum';
export * from './enums/competition-level.enum';
export * from './enums/competition-status.enum';
export * from './enums/consent-purpose.enum';
export * from './enums/contact-status.enum';
export * from './enums/contact-tab.enum';
export * from './enums/contact-topic.enum';
export * from './enums/dossier-status.enum';
export * from './enums/fixture-mode.enum';
export * from './enums/governance-model.enum';
export * from './enums/greats-evidence-type.enum';
export * from './enums/http-method.enum';
export * from './enums/ingestion-gate.enum';
export * from './enums/ingestion-run-status.enum';
export * from './enums/legal-document-kind.enum';
export * from './enums/notification-kind.enum';
export * from './enums/notification-filter.enum';
export * from './enums/observance-recognition.enum';
export * from './enums/observance-scope.enum';
export * from './enums/on-this-day-kind.enum';
export * from './enums/org-nature.enum';
export * from './enums/org-relation.enum';
export * from './enums/privacy-request-status.enum';
export * from './enums/privacy-right.enum';
export * from './enums/privacy-subject-kind.enum';
export * from './enums/review-status.enum';
export * from './enums/session-kind.enum';
export * from './enums/source-origin-kind.enum';
export * from './enums/source-usage-status.enum';
export * from './enums/suggestion-status.enum';
export * from './enums/text-validation-error.enum';
export * from './enums/tier.enum';
export * from './enums/user-role.enum';

// i18n (pt-BR source + en/es, same URL: the locale comes from a cookie/header)
export * from './i18n/formatters.helper';
export * from './i18n/locale.const';
export * from './i18n/locale.helper';
export * from './i18n/messages.helper';

// Consts
export * from './consts/admin-rules.const';
export * from './consts/achievement.const';
export * from './consts/analysis.const';
export * from './consts/api-error-messages.const';
export * from './consts/competition-level.const';
export * from './consts/demo-session.const';
export * from './consts/http-header.const';
export * from './consts/home.const';
export * from './consts/legacy-score.const';
export * from './consts/legal-documents.const';
export * from './consts/org-labels.const';
export * from './consts/pagination.const';
export * from './consts/rate-limits.const';
export * from './consts/source-url.const';
export * from './consts/sports-directory.const';
export * from './consts/text-limits.const';
export * from './consts/text-normalization.const';
export * from './consts/tier-medal.const';
export * from './consts/tier-vote.const';
export * from './consts/validation-messages.const';

// Types
export * from './types/api-contract.type';
export * from './types/banned-word.type';
export * from './types/source-rule.type';
export * from './types/validation-result.type';

// Schemas (API contracts and URL filters)
export * from './schemas/admin.schema';
export * from './schemas/admin-curation.schema';
export * from './schemas/admin-search.schema';
export * from './schemas/analysis.schema';
export * from './schemas/api-error.schema';
export * from './schemas/athlete-filters.schema';
export * from './schemas/athlete-list.schema';
export * from './schemas/athlete-profile.schema';
export * from './schemas/athlete-stats.schema';
export * from './schemas/athlete-summary.schema';
export * from './schemas/calendar-event.schema';
export * from './schemas/calendar.schema';
export * from './schemas/collection-run.schema';
export * from './schemas/comment.schema';
export * from './schemas/contact.schema';
export * from './schemas/country-ref.schema';
export * from './schemas/globe-country.schema';
export * from './schemas/hall-of-greats.schema';
export * from './schemas/home.schema';
export * from './schemas/iso-date.schema';
export * from './schemas/locale.schema';
export * from './schemas/media-link.schema';
export * from './schemas/moderation-rules.schema';
export * from './schemas/month-day.schema';
export * from './schemas/my-data.schema';
export * from './schemas/observance.schema';
export * from './schemas/on-this-day.schema';
export * from './schemas/organization.schema';
export * from './schemas/page-search.schema';
export * from './schemas/session.schema';
export * from './schemas/source-overview.schema';
export * from './schemas/source-ref.schema';
export * from './schemas/sources-filters.schema';
export * from './schemas/sport-stats.schema';
export * from './schemas/sport-page-filters.schema';
export * from './schemas/sport-page.schema';
export * from './schemas/sport-ref.schema';
export * from './schemas/sports-filters.schema';
export * from './schemas/sports-tree.schema';
export * from './schemas/tier-vote.schema';
export * from './schemas/web-vital.schema';
export * from './schemas/url-filter.schema';

// API contracts (method + path + schemas, used by the server routes and the web data layer)
export * from './contracts/admin.contract';
export * from './contracts/participation.contract';
export * from './contracts/public.contract';

// Helpers (pure, shared by server and web)
export * from './helpers/admin-rules.helper';
export * from './helpers/account.helper';
export * from './helpers/zod-error-map.helper';
export * from './helpers/achievement.helper';
export * from './helpers/commons-image.helper';
export * from './helpers/admin-summary.helper';
export * from './helpers/analysis.helper';
export * from './helpers/api-access.helper';
export * from './helpers/api-contract.helper';
export * from './helpers/athlete-filter.helper';
export * from './helpers/calendar-event.helper';
export * from './helpers/comment-thread.helper';
export * from './helpers/banned-words.helper';
export * from './helpers/contact-validation.helper';
export * from './helpers/email.helper';
export * from './helpers/home.helper';
export * from './helpers/iso-date.helper';
export * from './helpers/json-diff.helper';
export * from './helpers/month-day.helper';
export * from './helpers/protocol.helper';
export * from './helpers/source-url.helper';
export * from './helpers/sports-directory.helper';
export * from './helpers/suggestion-validation.helper';
export * from './helpers/text-normalize.helper';
export * from './helpers/text-validation.helper';
export * from './helpers/tier-rules.helper';
export * from './helpers/tier-votes.helper';
export * from './helpers/uuid.helper';

// SEO (doc 12): structured data, sitemap and robots, shared by the SSR (apps/web) and the server (apps/server)
export * from './seo/json-ld.helper';
export * from './seo/seo.const';
export * from './seo/sitemap.helper';
