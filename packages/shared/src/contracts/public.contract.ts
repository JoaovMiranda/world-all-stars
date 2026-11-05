import { ApiAccess } from '../enums/api-access.enum';
import { HttpMethod } from '../enums/http-method.enum';
import { defineContract } from '../helpers/api-contract.helper';
import { AnalysisDimensionsResponseSchema, CompareQuerySchema, CompareResponseSchema } from '../schemas/analysis.schema';
import { AthleteFiltersSchema } from '../schemas/athlete-filters.schema';
import { AthleteListResponseSchema } from '../schemas/athlete-list.schema';
import { AthleteProfileSchema, AthleteSlugParamsSchema } from '../schemas/athlete-profile.schema';
import { CalendarQuerySchema, CalendarResponseSchema } from '../schemas/calendar.schema';
import { CollectionRunsResponseSchema } from '../schemas/collection-run.schema';
import { HallOfGreatsResponseSchema } from '../schemas/hall-of-greats.schema';
import { HomeQuerySchema, HomeResponseSchema } from '../schemas/home.schema';
import { ValidationContextSchema } from '../schemas/moderation-rules.schema';
import { MonthDayParamsSchema, OnThisDayResponseSchema } from '../schemas/on-this-day.schema';
import { OrgTreeNodeSchema } from '../schemas/organization.schema';
import { SourcesResponseSchema } from '../schemas/source-overview.schema';
import { SportPageSchema, SportSlugParamsSchema } from '../schemas/sport-page.schema';
import { GovernanceModelsResponseSchema, SportsTreeResponseSchema } from '../schemas/sports-tree.schema';
import { z } from 'zod';

const pub = { method: HttpMethod.Get, access: ApiAccess.Public } as const;

/** Read-only public endpoints (doc 04). */
export const PublicApi = {
  home: defineContract({ ...pub, path: '/api/home', summary: 'Home payload for the client day', query: HomeQuerySchema, response: HomeResponseSchema }),
  athletes: defineContract({ ...pub, path: '/api/athletes', summary: 'Athletes list with filters', query: AthleteFiltersSchema, response: AthleteListResponseSchema }),
  athleteProfile: defineContract({ ...pub, path: '/api/athletes/:slug', summary: 'Full athlete profile (all tabs)', params: AthleteSlugParamsSchema, response: AthleteProfileSchema }),
  analysisDimensions: defineContract({ ...pub, path: '/api/analysis/dimensions', summary: 'Normalized analysis dimensions of every athlete', response: AnalysisDimensionsResponseSchema }),
  compare: defineContract({ ...pub, path: '/api/compare', summary: 'Analysis data for up to 5 athletes', query: CompareQuerySchema, response: CompareResponseSchema }),
  sports: defineContract({ ...pub, path: '/api/sports', summary: 'Sports tree with associations', response: SportsTreeResponseSchema }),
  sportPage: defineContract({ ...pub, path: '/api/sports/:slug', summary: 'Sport page', params: SportSlugParamsSchema, response: SportPageSchema }),
  governanceModels: defineContract({ ...pub, path: '/api/governance-models', summary: 'Governance models and their sports', response: GovernanceModelsResponseSchema }),
  organizations: defineContract({ ...pub, path: '/api/organizations', summary: 'Organization hierarchy (roots with children)', response: z.array(OrgTreeNodeSchema) }),
  hallOfGreats: defineContract({ ...pub, path: '/api/hall-of-greats', summary: 'Mythics with dossier + Legendary candidates', response: HallOfGreatsResponseSchema }),
  sources: defineContract({ ...pub, path: '/api/sources', summary: 'Sources registry overview', response: SourcesResponseSchema }),
  collectionRuns: defineContract({ ...pub, path: '/api/collection-runs', summary: 'AI-assisted collection runs (gates, facts, extractor tokens)', response: CollectionRunsResponseSchema }),
  calendar: defineContract({ ...pub, path: '/api/calendar', summary: 'Competitions and observances in a date range', query: CalendarQuerySchema, response: CalendarResponseSchema }),
  onThisDay: defineContract({ ...pub, path: '/api/today/:md', summary: 'On this day (MM-DD)', params: MonthDayParamsSchema, response: OnThisDayResponseSchema }),
  validationContext: defineContract({ ...pub, path: '/api/validation-context', summary: 'Inputs of the shared validators (banned words, sources, known athletes, sports)', response: ValidationContextSchema }),
} as const;
