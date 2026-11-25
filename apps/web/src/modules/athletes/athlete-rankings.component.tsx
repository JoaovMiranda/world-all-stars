import { athleteRankingsQuery } from '@/data/endpoints/athlete-rankings.query';
import { useText } from '@/i18n/use-text.hook';
import { ButtonLink } from '@/shared-ui/button-link.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { formatNumber } from '@/shared-ui/format.helper';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';

import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';

/** Positions of the athlete in every published ranking (rank, tie, score, designation) with a link to each ranking. */
export function AthleteRankings({ athleteSlug }: { athleteSlug: string }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).rankings;
  const rankings = athleteRankingsQuery.useQuery({ params: { slug: athleteSlug } });
  return (
    <Section title={T.title} eyebrow={T.eyebrow}>
      <QueryBoundary
        query={rankings}
        loading={<SkeletonList rows={2} className="h-12 w-full" />}
        errorTitle={T.error}
        isEmpty={(d) => !d.items.length}
        empty={<EmptyState compact title={T.empty} />}
      >
        {(d) => (
          <ul className="athlete-rankings" aria-label={T.listLabel}>
            {d.items.map((r) => (
              <li key={r.snapshotId}>
                <div className="min-w-0">
                  <span className="athlete-rankings-title">{r.title}</span>
                  <span className="athlete-rankings-facts">
                    <span>
                      {T.position}: <b>{r.rank === null ? T.unranked : r.rankTied ? T.tiedRank(r.rank) : T.rank(r.rank)}</b>
                    </span>
                    {r.score !== null && (
                      <span>
                        {T.score}: <b>{formatNumber(r.score)}</b>
                      </span>
                    )}
                    {r.band && (
                      <span>
                        {T.band}: <b>{T.bands[r.band] ?? r.band}</b>
                      </span>
                    )}
                  </span>
                </div>
                <ButtonLink to="/rankings/$id" params={{ id: r.snapshotId }} variant="secondary" size="sm" aria-label={T.openLabel(r.title)}>
                  {T.open}
                </ButtonLink>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </Section>
  );
}
