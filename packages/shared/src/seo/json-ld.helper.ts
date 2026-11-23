import { isCompetitionWin } from '../helpers/achievement.helper';
import type { AthleteProfile } from '../types/athlete-profile.type';
import type { SportPage } from '../types/sport-page.type';
import { SITE_LANGUAGE, SITE_NAME } from './seo.const';

/** One schema.org node (doc 12). Built on the server render, emitted as <script type="application/ld+json">. */
export type JsonLd = { '@context'?: string; '@type': string } & Record<string, unknown>;

const CONTEXT = 'https://schema.org';
const compact = <T extends Record<string, unknown>>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0))) as T;
const unique = (xs: readonly (string | null | undefined)[]): string[] => [...new Set(xs.filter((x): x is string => !!x))];

/** Absolute URL of a site path (`origin` = PUBLIC_URL, without trailing slash). */
export const siteUrl = (origin: string, path: string): string => `${origin.replace(/\/+$/, '')}${path}`;

/** Home: the site and its search (Sitelinks search box → /athletes?q=). */
export const webSiteJsonLd = (origin: string): JsonLd => ({
  '@context': CONTEXT,
  '@type': 'WebSite',
  '@id': siteUrl(origin, '/#website'),
  name: SITE_NAME,
  url: siteUrl(origin, '/'),
  inLanguage: SITE_LANGUAGE,
  publisher: { '@id': siteUrl(origin, '/#organization') },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: siteUrl(origin, '/athletes?q={search_term_string}') },
    'query-input': 'required name=search_term_string',
  },
});

/** Home: who publishes the site. */
export const organizationJsonLd = (origin: string): JsonLd => ({
  '@context': CONTEXT,
  '@type': 'Organization',
  '@id': siteUrl(origin, '/#organization'),
  name: SITE_NAME,
  url: siteUrl(origin, '/'),
  logo: siteUrl(origin, '/favicon.svg'),
});

export interface Crumb {
  name: string;
  /** Site path; the last crumb (current page) may omit it. */
  path?: string;
}

/** Detail pages: Início › … › current page. */
export const breadcrumbJsonLd = (origin: string, crumbs: readonly Crumb[]): JsonLd => ({
  '@context': CONTEXT,
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => compact({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.path ? siteUrl(origin, c.path) : undefined })),
});

/** Lists (athletes, Hall of Greats, sports): ordered links to the entity pages. */
export const itemListJsonLd = (origin: string, name: string, items: readonly { name: string; path: string }[]): JsonLd => ({
  '@context': CONTEXT,
  '@type': 'ItemList',
  name,
  numberOfItems: items.length,
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: siteUrl(origin, it.path) })),
});

/** Wikidata + Wikipedia links of an athlete (`sameAs`). */
const athleteSameAs = (p: AthleteProfile): string[] =>
  unique([
    p.wikidataQid ? `https://www.wikidata.org/wiki/${p.wikidataQid}` : null,
    ...p.sourceLinks.filter((s) => /wikipedia|wikidata/.test(s.slug)).map((s) => s.url),
  ]);

/** Titles won and awards ("Copa do Mundo FIFA (1958)"), most recent last. */
const athleteAwards = (p: AthleteProfile): string[] =>
  unique(
    p.achievements.map((a) => {
      const label = isCompetitionWin(a) ? a.competition.name : a.kind === 'award' ? a.award.name : null;
      return label ? `${label}${a.year ? ` (${a.year})` : ''}` : null;
    }),
  );

/** Athlete profile: ProfilePage whose main entity is the Person (Google "ProfilePage" rich result). */
export const athleteJsonLd = (origin: string, p: AthleteProfile): JsonLd => {
  const url = siteUrl(origin, `/athletes/${p.slug}`);
  const place = (e: AthleteProfile['birth']) =>
    e.city ? compact({ '@type': 'Place', name: [e.city.name, e.city.region, e.city.country?.name].filter(Boolean).join(', ') }) : undefined;
  return {
    '@context': CONTEXT,
    '@type': 'ProfilePage',
    url,
    inLanguage: SITE_LANGUAGE,
    mainEntity: compact({
      '@type': 'Person',
      '@id': `${url}#person`,
      name: p.knownAs,
      alternateName: unique([p.fullName, ...p.nicknames]).filter((n) => n !== p.knownAs),
      url,
      image: p.photo?.url,
      description: p.shortBio ?? undefined,
      birthDate: p.birth.date ?? undefined,
      birthPlace: place(p.birth),
      deathDate: p.death?.date ?? undefined,
      deathPlace: p.death ? place(p.death) : undefined,
      nationality: p.nationalities.map((n) => ({ '@type': 'Country', name: n.name })),
      knowsAbout: p.sport.name,
      memberOf: unique(p.teams.map((t) => t.name)).map((name) => ({ '@type': 'SportsTeam', name })),
      award: athleteAwards(p),
      sameAs: athleteSameAs(p),
    }),
  };
};

/** Sport page: the sport as a Thing (Wikidata/Wikipedia) and its governing organizations. */
export const sportJsonLd = (origin: string, s: SportPage): JsonLd => ({
  '@context': CONTEXT,
  '@type': 'CollectionPage',
  url: siteUrl(origin, `/sports/${s.slug}`),
  name: s.name,
  inLanguage: SITE_LANGUAGE,
  about: compact({
    '@type': 'Thing',
    name: s.name,
    description: s.description ?? undefined,
    sameAs: unique([s.wikidataQid ? `https://www.wikidata.org/wiki/${s.wikidataQid}` : null, s.wikipedia]),
  }),
  mentions: s.associations.map((a) =>
    compact({ '@type': 'SportsOrganization', name: a.name, sport: s.name, url: a.wikipedia ?? undefined, logo: a.image ?? undefined }),
  ),
});

/**
 * JSON for a <script type="application/ld+json">: `<`, `>`, `&` and line separators are escaped, so no value can
 * close the script element.
 */
export const serializeJsonLd = (data: JsonLd): string =>
  JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
