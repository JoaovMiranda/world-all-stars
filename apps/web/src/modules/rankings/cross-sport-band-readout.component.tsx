import './cross-sport.css';

import { Link } from '@tanstack/react-router';

import { athleteBandQuery } from '@/data/endpoints/cross-sport.query';
import { useText } from '@/i18n/use-text.hook';
import { formatNumber } from '@/shared-ui/format.helper';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';

import { CROSS_SPORT_MESSAGES } from './cross-sport.const';
import { CrossSportBandBadge } from './cross-sport-band-badge.component';

interface CrossSportBandReadoutProps {
  athleteSlug: string;
  /** Heading level inside the host page (h2 by default). */
  headingLevel?: 2 | 3;
}

/** Profile readout of the cross-sport band (D07): band, points, accepted items; separate from rankings and legacy. */
export function CrossSportBandReadout({ athleteSlug, headingLevel = 2 }: CrossSportBandReadoutProps) {
  const t = useText(CROSS_SPORT_MESSAGES);
  const query = athleteBandQuery.useQuery({ params: { slug: athleteSlug } });
  return (
    <Section title={t.readout.title} eyebrow={t.page.disclaimerTitle} headingLevel={headingLevel}>
      <QueryBoundary query={query} loading={<SkeletonList rows={2} />}>
        {(d) => (
          <div className="stack gap-2">
            {d.band ? (
              <>
                <p className="band-readout-head">
                  <CrossSportBandBadge band={d.band} />
                  <span>
                    <b className="font-semibold">{t.bands.names[d.band]}</b>
                    <span className="muted"> · {t.bands.pointsLong(formatNumber(d.points))}</span>
                  </span>
                </p>
                <ul className="stack gap-1" aria-label={t.page.accepted}>
                  {d.items.map((i) => (
                    <li key={i.evidenceId} className="band-readout-head">
                      <CrossSportBandBadge band={i.band} size="sm" />
                      <span>
                        {i.label}
                        {i.year !== null && <span className="muted"> · {i.year}</span>}
                        <span className="muted"> · {t.bands.points(formatNumber(i.points))}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="muted">{t.readout.none}</p>
            )}
            {d.pendingReview > 0 && <p className="muted">{t.page.unmappedNote(d.pendingReview)}</p>}
            <p className="muted">{t.readout.note}</p>
            <p>
              <Link to="/rankings/all-sports/methodology">{t.readout.methodologyLink}</Link>
              {' · '}
              <Link to="/rankings/all-sports">{t.readout.allSportsLink}</Link>
            </p>
          </div>
        )}
      </QueryBoundary>
    </Section>
  );
}
