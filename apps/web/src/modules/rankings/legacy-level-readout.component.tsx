import './cross-sport.css';

import { athleteLegacyQuery } from '@/data/endpoints/cross-sport.query';
import { useText } from '@/i18n/use-text.hook';
import { formatNumber } from '@/shared-ui/format.helper';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';

import { CROSS_SPORT_MESSAGES } from './cross-sport.const';

interface LegacyLevelReadoutProps {
  athleteSlug: string;
  /** Heading level inside the host page (h2 by default). */
  headingLevel?: 2 | 3;
}

/** Profile readout of the legacy level L1–L5 (D11): what it means, the L5 dossier gate, honors; never competitive points. */
export function LegacyLevelReadout({ athleteSlug, headingLevel = 2 }: LegacyLevelReadoutProps) {
  const t = useText(CROSS_SPORT_MESSAGES).legacy;
  const query = athleteLegacyQuery.useQuery({ params: { slug: athleteSlug } });
  return (
    <Section title={t.title} headingLevel={headingLevel}>
      <QueryBoundary query={query} loading={<SkeletonList rows={2} />}>
        {(d) => {
          const aboveWithoutDossier = d.level !== 'L5' && d.score >= d.l5Threshold && d.dossierStatus !== 'approved';
          return (
            <div className="stack gap-2">
              <p className="legacy-level">{t.levels[d.level]}</p>
              <p>{t.meaning[d.level]}</p>
              <p className="muted">
                {t.score(formatNumber(d.score))} · {d.dossierStatus ? (t.dossier[d.dossierStatus] ?? d.dossierStatus) : t.noDossier}
              </p>
              {aboveWithoutDossier && <p>{t.aboveThreshold}</p>}
              <p className="muted">{t.l5Gate}</p>
              <p>
                <b className="font-semibold">{t.separate}</b>
              </p>
              {(d.accepted.length > 0 || d.excluded.length > 0) && (
                <details>
                  <summary>{t.showDetails}</summary>
                  {d.accepted.length > 0 && (
                    <>
                      <p className="font-semibold">{t.accepted}</p>
                      <ul className="stack gap-1">
                        {d.accepted.map((h) => (
                          <li key={h.evidenceId}>
                            {h.label}
                            <span className="muted">
                              {' · '}
                              {t.honors[h.kind] ?? h.kind}
                              {h.year !== null && ` · ${h.year}`} · {t.points(h.points)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {d.excluded.length > 0 && (
                    <>
                      <p className="font-semibold">{t.excluded}</p>
                      <ul className="stack gap-1">
                        {d.excluded.map((e) => (
                          <li key={e.evidenceId}>
                            {e.label}
                            <span className="muted"> · {t.reasons[e.reason] ?? e.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </details>
              )}
            </div>
          );
        }}
      </QueryBoundary>
    </Section>
  );
}
