import './compare.css';

import { Link } from '@tanstack/react-router';
import { HeadToHeadSearchSchema } from '@was/shared';

import { athletesQuery } from '@/data/endpoints/athletes.query';
import { headToHeadQuery } from '@/data/endpoints/compare.query';
import { useText } from '@/i18n/use-text.hook';
import { ALL_ATHLETES_INPUT } from '@/modules/athletes/athletes-query.const';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { Notice } from '@/shared-ui/notice.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';

import { COMPARE_MESSAGES } from './compare.const';
import { headToHeadInput, isComparablePair } from './compare-query.helper';
import { CompareSelect } from './compare-select.component';
import { HeadToHeadMethodology } from './head-to-head-methodology.component';
import { HeadToHeadTable } from './head-to-head-table.component';

/** The comparison of a chosen pair (its own component: the query runs only once both are chosen). */
function HeadToHead({ pair }: { pair: { a: string; b: string } }) {
  const t = useText(COMPARE_MESSAGES);
  const query = headToHeadQuery.useQuery(headToHeadInput(pair));
  return (
    <QueryBoundary query={query} loading={<SkeletonList rows={6} />} notFound={<EmptyState title={t.page.notFoundTitle}>{t.page.notFoundText}</EmptyState>}>
      {(d) => (
        <div className="stack">
          <HeadToHeadTable data={d} />
          <HeadToHeadMethodology data={d} />
          <p className="muted">
            {t.footer.rulesets(d.bandRulesetVersion, d.legacyRulesetVersion)} · <Link to="/rankings/all-sports/methodology">{t.footer.bandsMethodology}</Link>
          </p>
          <p className="muted">{t.page.shareHint}</p>
        </div>
      )}
    </QueryBoundary>
  );
}

/** `/compare?a=&b=` (D04): pick two competitors; the pair lives in the URL (share link), never indexed. */
export function ComparePage() {
  const t = useText(COMPARE_MESSAGES).page;
  const { filters, setFilters } = useUrlFilters(HeadToHeadSearchSchema);
  const athletes = athletesQuery.useQuery(ALL_ATHLETES_INPUT);
  return (
    <PageLayout title={t.title} eyebrow={t.eyebrow} lead={t.lead} breadcrumb={[{ label: t.breadcrumb, link: { to: '/athletes' } }, { label: t.title }]}>
      <Notice tone="info">
        <p>
          <b className="font-semibold">{t.disclaimerTitle}.</b> {t.disclaimer}
        </p>
      </Notice>
      <CompareSelect value={filters} candidates={athletes.data?.items ?? []} onChange={(next) => setFilters({ a: next.a, b: next.b })} />
      {isComparablePair(filters) ? (
        <HeadToHead pair={filters} />
      ) : (
        <p className="muted" aria-live="polite">
          {filters.a && filters.a === filters.b ? t.sameHint : t.pickHint}
        </p>
      )}
    </PageLayout>
  );
}
