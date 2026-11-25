import { ATHLETE_PROFILE_TAB_VALUES, type AthleteProfile, AthleteProfileSearchSchema, AthleteProfileTab, CommentSort } from '@was/shared';
import { type ReactNode, useCallback, useMemo } from 'react';

import { commentsQuery } from '@/data/endpoints/comments.query';
import { useLocale } from '@/i18n/locale.store';
import { useText } from '@/i18n/use-text.hook';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { Tabs } from '@/shared-ui/tabs.component';
import { TierTag } from '@/shared-ui/tier-tag.component';
import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';

import { AchievementsTab } from '../achievements-tab.component';
import { AnalysisTab } from '../analysis-tab.component';
import { AthleteBadges, AthleteHeroActions, AthleteHeroDetails, AthleteNames } from '../athlete-hero.component';
import { AthleteInteractions } from '../athlete-interactions.component';
import { AthleteInfobox } from '../athlete-infobox.component';
import { AthleteKpis } from '../athlete-kpis.component';
import { ATHLETE_PROFILE_MESSAGES } from '../athletes.const';
import { commentsInput } from '../athletes-query.helper';
import { CareerTab } from '../career-tab.component';
import { CommentsTab } from '../comments-tab.component';
import { OverviewTab } from '../overview-tab.component';
import { ProfileTitles } from '../profile-titles.component';
import { SourcesTab } from '../sources-tab.component';
import { resolveSportPanel } from '../sport-panels/sport-panel.registry';
import { TierDecor, TierEpigraph, TierMedia, tierPageClass, useTierCeremony } from '../tier-hero.component';
import { SportBlocks } from './sport-blocks.component';

const TABS_ID = 'perfil-abas';

const splitSlugs = (value: string | undefined) => [
  ...new Set(
    (value ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  ),
];

interface ProfileShellProps {
  athlete: AthleteProfile;
  slug: string;
  /** Sport-specific block shown first in the Overview tab (BJJ classes, Olympic medals). */
  lead?: ReactNode;
  /** Methodology positions before the sport panel (boxing designation, chess) instead of after it. */
  rankingsFirst?: boolean;
  /** Visible data-source credit under the tabs (football: Fjelstul World Cup Database, CC BY-SA, T4.6). */
  attribution?: ReactNode;
}

/**
 * Shared frame of every profile template: hero, sport KPIs, the six URL-synced tabs (?tab=, ?compare=, ?sort=) and the
 * infobox. Templates only decide the sport-specific block of the Overview tab (`lead`, `rankingsFirst`).
 */
export function ProfileShell({ athlete, slug, lead, rankingsFirst = false, attribution }: ProfileShellProps) {
  const t = useText(ATHLETE_PROFILE_MESSAGES);
  const { filters, setFilter, setFilters } = useUrlFilters(AthleteProfileSearchSchema);
  const tab = filters.tab ?? AthleteProfileTab.Overview;
  const sort = filters.sort ?? CommentSort.Top;
  const comments = commentsQuery.useQuery(commentsInput(slug, filters.sort));
  const locale = useLocale();
  // biome-ignore lint/correctness/useExhaustiveDependencies: panels read texts of the current language
  const panel = useMemo(() => resolveSportPanel(athlete), [athlete, locale]);
  const compare = useMemo(() => splitSlugs(filters.compare).filter((s) => s !== athlete.slug), [filters.compare, athlete.slug]);

  const selectTab = useCallback((v: AthleteProfileTab) => setFilter('tab', v === AthleteProfileTab.Overview ? undefined : v), [setFilter]);
  const goTo = useCallback(
    (v: AthleteProfileTab) => {
      selectTab(v);
      requestAnimationFrame(() => {
        const list = document.getElementById(TABS_ID);
        list?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        list?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus({ preventScroll: true });
      });
    },
    [selectTab],
  );

  const isWide = tab === AthleteProfileTab.Analysis;
  const content = {
    [AthleteProfileTab.Overview]: (
      <OverviewTab profile={athlete} sportPanel={<SportBlocks athleteSlug={athlete.slug} panel={panel.panel} lead={lead} rankingsFirst={rankingsFirst} titles={<ProfileTitles profile={athlete} />} />} />
    ),
    [AthleteProfileTab.Achievements]: <AchievementsTab profile={athlete} />,
    [AthleteProfileTab.Career]: <CareerTab profile={athlete} />,
    [AthleteProfileTab.Analysis]: (
      <AnalysisTab profile={athlete} compare={compare} onCompareChange={(slugs) => setFilters({ compare: slugs.length ? slugs.join(',') : undefined })} />
    ),
    [AthleteProfileTab.Sources]: <SourcesTab profile={athlete} />,
    [AthleteProfileTab.Comments]: (
      <QueryBoundary query={comments} loading={<SkeletonList rows={4} className="h-24 w-full" />}>
        {(c) => <CommentsTab profile={athlete} comments={c} sort={sort} onSort={(s) => setFilter('sort', s === CommentSort.Top ? undefined : s)} />}
      </QueryBoundary>
    ),
  }[tab];

  const counts: Partial<Record<AthleteProfileTab, number>> = {
    [AthleteProfileTab.Achievements]: athlete.achievements.length,
    [AthleteProfileTab.Sources]: athlete.provenance.length,
    ...(comments.data ? { [AthleteProfileTab.Comments]: comments.data.total } : {}),
  };

  const ceremony = useTierCeremony(athlete.slug);

  return (
    <PageLayout
      className={tierPageClass(athlete.tier, ceremony.short)}
      decor={<TierDecor tier={athlete.tier} />}
      title={athlete.knownAs}
      contentLocale={athlete.contentLocale}
      eyebrow={t.eyebrow}
      badges={
        <>
          <TierTag tier={athlete.tier} />
          <AthleteBadges profile={athlete} />
        </>
      }
      lead={<AthleteNames profile={athlete} />}
      headerExtra={
        <>
          <TierEpigraph profile={athlete} />
          <AthleteHeroDetails profile={athlete} />
        </>
      }
      media={<TierMedia profile={athlete} />}
      actions={
        <>
          <AthleteInteractions key={athlete.slug} slug={athlete.slug} counts={athlete.interactions} />
          <AthleteHeroActions version={athlete.version.current} onGo={goTo} slug={athlete.slug} />
        </>
      }
      breadcrumb={[
        { label: athlete.sport.name, link: { to: '/sports/$slug', params: { slug: athlete.sport.slug } } },
        { label: t.breadcrumb, link: { to: '/athletes', search: { sport: athlete.sport.slug } } },
        { label: athlete.knownAs },
      ]}
    >
      <AthleteKpis kpis={panel.kpis} />
      <div id={TABS_ID} className="min-w-0 scroll-mt-16">
        <Tabs
          label={t.tabsLabel}
          value={tab}
          onChange={selectTab}
          tabs={ATHLETE_PROFILE_TAB_VALUES.map((v) => ({ value: v, label: t.tabs[v], ...(counts[v] !== undefined ? { count: counts[v] } : {}) }))}
        >
          <div className={isWide ? 'profile-body is-wide' : 'profile-body'}>
            <div className="min-w-0">{content}</div>
            {!isWide && (
              <aside aria-label={t.infobox.eyebrow}>
                <AthleteInfobox profile={athlete} />
              </aside>
            )}
          </div>
        </Tabs>
      </div>
      {attribution}
    </PageLayout>
  );
}
