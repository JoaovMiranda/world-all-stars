import './hall-of-greats.page.css';

import { hallOfGreatsQuery } from '@/data/endpoints/discovery.query';
import { useText } from '@/i18n/use-text.hook';
import { AthleteGrid } from '@/shared-ui/athlete-grid.component';
import { ButtonLink } from '@/shared-ui/button-link.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { Skeleton } from '@/shared-ui/skeleton.component';

import { HALL_OF_GREATS_MESSAGES } from './hall-of-greats.const';
import { LegendCard } from './legend-card.component';

const loading = (
  <div className="legends">
    {[0, 1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-48 w-full rounded-(--r-lg)" />
    ))}
  </div>
);

/** P11 Hall of Greats (doc 09): always-dark stage · entry rules · Mythics with dossier · queue of Legendary candidates. */
export function HallOfGreatsPage() {
  const T = useText(HALL_OF_GREATS_MESSAGES);
  const hall = hallOfGreatsQuery.useQuery();
  return (
    <div className="hall-stage theme-stage">
      <PageLayout
        title={T.page.title}
        heading={<span className="hall-title">{T.page.heading}</span>}
        eyebrow={<span className="label-gold">{T.page.eyebrow}</span>}
        lead={T.page.lead}
        breadcrumb={[{ label: T.page.title }]}
        contentLocale={hall.data?.contentLocale}
      >
        <ul className="hall-rules" aria-label={T.rules.label}>
          {T.rules.items.map((r) => (
            <li key={r.title} className="hall-rule">
              <b>{r.title}</b>
              {r.text}
            </li>
          ))}
        </ul>
        <QueryBoundary query={hall} loading={loading}>
          {({ greats, candidates }) => (
            <>
              <section aria-label={T.legends.label}>
                {greats.length > 0 ? (
                  <ul className="legends">
                    {greats.map((g) => (
                      <li key={g.slug}>
                        <LegendCard athlete={g} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title={T.legends.emptyTitle} mark="★" action={<ButtonLink to="/about/criteria">{T.legends.emptyAction}</ButtonLink>}>
                    {T.legends.emptyText}
                  </EmptyState>
                )}
              </section>
              <Section variant="plain" title={T.queue.title} eyebrow={T.queue.eyebrow} className="mt-6">
                <AthleteGrid athletes={candidates} emptyTitle={T.queue.emptyTitle} emptyText={T.queue.emptyText} />
              </Section>
            </>
          )}
        </QueryBoundary>
      </PageLayout>
    </div>
  );
}
