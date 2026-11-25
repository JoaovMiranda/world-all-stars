import type { AthleteRef, InteractionStateResponse, MyInteractionsResponse } from '@was/shared';

import { ApiError } from '../api-error.error';
import { demoStore } from '../demo.store';
import type { loadSample } from '../sample-fixtures.helper';

type Sample = typeof loadSample;

const refOf = async (sample: Sample, slug: string): Promise<AthleteRef | null> => {
  const profile = (await sample('athlete-profiles.json'))[slug];
  if (!profile) return null;
  return { slug: profile.slug, knownAs: profile.knownAs, tier: demoStore.get().officialTiers[slug]?.tier ?? profile.tier };
};

/** My star/heart on one athlete + its counts: the sample counts plus the tester's own star and heart. */
const stateOf = async (sample: Sample, slug: string): Promise<InteractionStateResponse> => {
  const profile = (await sample('athlete-profiles.json'))[slug];
  if (!profile) throw new ApiError(404, { error: 'not_found' });
  const demo = demoStore.get();
  const base = profile.interactions ?? { stars: 0, hearts: 0 };
  const starred = demo.star?.slug === slug;
  const hearted = !!demo.hearts[slug];
  return { starred, hearted, counts: { stars: base.stars + (starred ? 1 : 0), hearts: base.hearts + (hearted ? 1 : 0) } };
};

/** GET /api/me/interactions in fixture mode: the tester's star and hearts (demo store). */
export const buildMyInteractions = async (sample: Sample): Promise<MyInteractionsResponse> => {
  const demo = demoStore.get();
  const star = demo.star ? await refOf(sample, demo.star.slug) : null;
  const hearts = await Promise.all(Object.entries(demo.hearts).map(async ([slug, at]) => ({ ref: await refOf(sample, slug), at })));
  return {
    star: star && demo.star ? { athlete: star, at: demo.star.at } : null,
    hearts: hearts.flatMap(({ ref, at }) => (ref ? [{ athlete: ref, at }] : [])),
  };
};

/** PUT star: the exclusive star moves to this athlete. */
export const setDemoStar = async (sample: Sample, slug: string) => {
  await stateOf(sample, slug);
  demoStore.update((d) => {
    if (d.star?.slug !== slug) d.star = { slug, at: new Date().toISOString() };
  });
  return stateOf(sample, slug);
};

/** DELETE star: only when it is on this athlete. */
export const clearDemoStar = async (sample: Sample, slug: string) => {
  await stateOf(sample, slug);
  demoStore.update((d) => {
    if (d.star?.slug === slug) d.star = null;
  });
  return stateOf(sample, slug);
};

/** PUT heart: the desired state. */
export const setDemoHeart = async (sample: Sample, slug: string, hearted: boolean) => {
  await stateOf(sample, slug);
  demoStore.update((d) => {
    if (hearted) d.hearts[slug] ??= new Date().toISOString();
    else delete d.hearts[slug];
  });
  return stateOf(sample, slug);
};
