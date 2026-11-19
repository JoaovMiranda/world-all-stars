import { Link } from '@tanstack/react-router';
import type { IsoDate } from '@was/shared';

import { rankingsQuery } from '@/data/endpoints/rankings.query';
import { useText } from '@/i18n/use-text.hook';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { formatDate } from '@/shared-ui/format.helper';

import { RANKINGS_MESSAGES } from './rankings.const';

/** Rankings (handoff v3 §8): published snapshots grouped by methodology; each links to its immutable table. */
export function RankingsPage() {
  const t = useText(RANKINGS_MESSAGES).list;
  const query = rankingsQuery.useQuery();
  return (
    <PageLayout title={t.title} eyebrow={t.eyebrow} lead={t.lead} breadcrumb={[{ label: t.title }]}>
      <QueryBoundary query={query} loading={<SkeletonList rows={4} />} isEmpty={(d) => d.items.length === 0} empty={<EmptyState title={t.emptyTitle}>{t.emptyText}</EmptyState>}>
        {(data) => {
          const groups = [...new Set(data.items.map((i) => i.methodology))];
          return groups.map((methodology) => (
            <Section key={methodology} title={methodology} eyebrow={t.methodology}>
              <ul className="stack gap-2">
                {data.items
                  .filter((i) => i.methodology === methodology)
                  .map((i) => (
                    <li key={i.id}>
                      <Link to="/rankings/$id" params={{ id: i.id }}>
                        <b className="font-semibold">{i.title}</b>
                      </Link>{' '}
                      <span className="muted">
                        · {t.entries(i.entries)}
                        {i.publishedAt && ` · ${t.published(formatDate(i.publishedAt.slice(0, 10) as IsoDate))}`}
                      </span>
                    </li>
                  ))}
              </ul>
            </Section>
          ));
        }}
      </QueryBoundary>
    </PageLayout>
  );
}
