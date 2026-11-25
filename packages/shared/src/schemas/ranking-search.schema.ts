// URL filters of the ranking pages (T2.5). One superset of tolerant keys (an invalid value is dropped, never a 400),
// and one typed subset per methodology. The same keys are the API query of GET /api/rankings/:id.
import { z } from 'zod';

import { BJJ_BELT_VALUES } from '../enums/bjj-belt.enum';
import { GI_MODE_VALUES } from '../enums/gi-mode.enum';
import { RANKING_FILTER_KEY_VALUES } from '../enums/ranking-filter-key.enum';
import { OLYMPIC_SEASON_VALUES } from '../enums/olympic-season.enum';
import { RANKING_SEX_VALUES } from '../enums/ranking-sex.enum';
import { RANKING_SORT_VALUES } from '../enums/ranking-sort.enum';
import { optionalEnum, optionalPage, optionalText } from './url-filter.schema';

/** Free value (slug, code, label): the router may parse `?weight=94` as a number, so numbers are kept as text. */
const optionalValue = () =>
  z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim())
    .transform((v) => (v === '' ? undefined : v))
    .optional()
    .catch(undefined);

/** Tri-state flag: `true` (only), `false` (exclude), absent (all). Accepts the router's boolean and the API's text. */
const optionalFlag = () =>
  z
    .union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')])
    .optional()
    .catch(undefined);

/** Edition year (`?edition=2002`). */
const optionalYear = () => z.coerce.number().int().min(1800).max(2200).optional().catch(undefined);

/** Every ranking filter key (superset). Each methodology picks its own subset below. */
export const RankingFilterFieldsSchema = z.object({
  /** Competition sex category (BJJ). */
  sex: optionalEnum(RANKING_SEX_VALUES),
  gi: optionalEnum(GI_MODE_VALUES),
  belt: optionalEnum(BJJ_BELT_VALUES),
  /** Weight class (slug or label of the `weight` category value). */
  weight: optionalValue(),
  /** Absolute / open-weight divisions only (true) or weight classes only (false). */
  absolute: optionalFlag(),
  /** Represented country: ISO 3166-1 alpha-2 or internal country code (`urs`), case-insensitive. */
  country: optionalValue(),
  /** Organizing body or competition slug (`adcc`, `ibjjf`, `wbc`). */
  organization: optionalValue(),
  /** Gender of the people ranked (football overview, chess, Ironman). */
  gender: optionalEnum(RANKING_SEX_VALUES),
  /** Competition slug (`fifa-world-cup`). */
  competition: optionalValue(),
  /** Same as country, named as in football. */
  nationality: optionalValue(),
  edition: optionalYear(),
  /** Playing position (slug, `goalkeeper`). */
  position: optionalValue(),
  /** Boxing weight division (slug or label). */
  division: optionalValue(),
  /** Sport slug (Olympic medals). */
  sport: optionalValue(),
  season: optionalEnum(OLYMPIC_SEASON_VALUES),
  /** National Olympic Committee code (`BRA`) or country code. */
  noc: optionalValue(),
});

/** Table state that is not a filter: page (1-based) and sort (sort-only: ignored by the canonical URL). */
const RankingTableStateSchema = z.object({ page: optionalPage(), sort: optionalEnum(RANKING_SORT_VALUES) });

/** URL state of /rankings/$id before the methodology is known: every filter key + page + sort. */
export const RankingDetailSearchSchema = RankingFilterFieldsSchema.extend(RankingTableStateSchema.shape);

export const BjjRankingSearchSchema = RankingFilterFieldsSchema.pick({
  sex: true,
  gi: true,
  belt: true,
  weight: true,
  absolute: true,
  country: true,
  organization: true,
}).extend(RankingTableStateSchema.shape);

export const FootballRankingSearchSchema = RankingFilterFieldsSchema.pick({
  gender: true,
  competition: true,
  nationality: true,
  edition: true,
  position: true,
}).extend(RankingTableStateSchema.shape);

export const BoxingRankingSearchSchema = RankingFilterFieldsSchema.pick({ division: true, organization: true }).extend(RankingTableStateSchema.shape);

export const OlympicRankingSearchSchema = RankingFilterFieldsSchema.pick({ sport: true, season: true, noc: true }).extend(RankingTableStateSchema.shape);

/** Chess and Ironman snapshots carry the people's gender and represented country. */
export const ChessRankingSearchSchema = RankingFilterFieldsSchema.pick({ gender: true, country: true }).extend(RankingTableStateSchema.shape);
export const IronmanRankingSearchSchema = RankingFilterFieldsSchema.pick({ gender: true, country: true }).extend(RankingTableStateSchema.shape);

/** URL filters of /rankings and query of GET /api/rankings: methodology, sport and the ranking's sex category. */
export const RankingsListQuerySchema = z.object({
  methodology: optionalText(),
  sport: optionalText(),
  gender: optionalEnum(RANKING_SEX_VALUES),
});

/** GET /api/rankings/:id/filters: the filters of the snapshot's methodology with the values present in its entries. */
export const RankingFilterOptionsResponseSchema = z.object({
  methodology: z.string().min(1),
  filters: z.array(
    z.object({
      key: z.enum(RANKING_FILTER_KEY_VALUES),
      options: z.array(z.object({ value: z.string().min(1), label: z.string().min(1) })),
    }),
  ),
});
