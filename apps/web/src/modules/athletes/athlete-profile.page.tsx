import './athlete-profile.css';

import { ATHLETE_PROFILE_TAB_VALUES, type AthleteProfile, AthleteProfileSearchSchema, AthleteProfileTab, CommentSort } from '@was/shared';
import { getRouteApi } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';

import { athleteProfileQuery } from '@/data/endpoints/athletes.query';
import { commentsQuery } from '@/data/endpoints/comments.query';
import { useLocale } from '@/i18n/locale.store';
import { useText } from '@/i18n/use-text.hook';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { Tabs } from '@/shared-ui/tabs.component';
import { TierPortrait } from '@/shared-ui/tier-portrait.component';
import { TierTag } from '@/shared-ui/tier-tag.component';
import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';

import { AchievementsTab } from './achievements-tab.component';
import { AnalysisTab } from './analysis-tab.component';
import { AthleteBadges, AthleteHeroActions, AthleteHeroDetails, AthleteNames } from './athlete-hero.component';
import { AthleteInfobox } from './athlete-infobox.component';
import { AthleteKpis } from './athlete-kpis.component';
import { AthleteProfileSkeleton } from './athlete-profile-skeleton.component';
import { athleteProfileInput, commentsInput } from './athletes-query.helper';
import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';
import { CareerTab } from './career-tab.component';
import { CommentsTab } from './comments-tab.component';
import { OverviewTab } from './overview-tab.component';
import { SourcesTab } from './sources-tab.component';
import { resolveSportPanel } from './sport-panels/sport-panel.registry';

const route = getRouteApi('/athletes/$slug');
const TABS_ID = 'perfil-abas';

const splitSlugs = (value: string | undefined) => [...new Set((value ?? '').split(',').map((s) => s.trim()).filter(Boolean))];

function Profile({ athlete, slug }: { athlete: AthleteProfile; slug: string }) {
  const t = useText(ATHLETE_PROFILE_MESSAGES);
  const { filters, setFilter, setFilters } = useUrlFilters(AthleteProfileSearchSchema);
  const tab = filters.tab ?? AthleteProfileTab.Overview;
  const sort = filters.sort ?? CommentSort.Top;
  const comments = commentsQuery.useQuery(commentsInput(slug, filters.sort));
  const locale = useLocale();
  const panel = useMemo(() => resolveSportPanel(athlete), [athlete, locale]); // panels read texts of the current language
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
    [AthleteProfileTab.Overview]: <OverviewTab profile={athlete} sportPanel={panel.panel} />,
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

  return (
    <PageLayout
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
      headerExtra={<AthleteHeroDetails profile={athlete} />}
      media={<TierPortrait name={athlete.knownAs} tier={athlete.tier} photo={athlete.photo} />}
      actions={<AthleteHeroActions version={athlete.version.current} onGo={goTo} />}
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
    </PageLayout>
  );
}

/** P2 Athlete profile (doc 09): hero, sport KPIs and the six URL-synced tabs (?tab=, ?compare=, ?sort=). */
export function AthleteProfilePage() {
  const t = useText(ATHLETE_PROFILE_MESSAGES);
  const { slug } = route.useParams();
  const profile = athleteProfileQuery.useQuery(athleteProfileInput(slug));
  return (
    <QueryBoundary
      query={profile}
      loading={<AthleteProfileSkeleton />}
      errorTitle={t.errorTitle}
      notFound={
        <PageLayout title={t.notFoundTitle} breadcrumb={[{ label: t.breadcrumb, link: { to: '/athletes' } }, { label: slug }]}>
          <EmptyState title={t.notFoundTitle} mark="?">
            {t.notFoundText}
          </EmptyState>
        </PageLayout>
      }
    >
      {(athlete) => <Profile key={athlete.slug} athlete={athlete} slug={slug} />}
    </QueryBoundary>
  );
}
