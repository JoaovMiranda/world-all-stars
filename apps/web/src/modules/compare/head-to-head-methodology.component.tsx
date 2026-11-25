import type { HeadToHeadResponse } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { formatNumber } from '@/shared-ui/format.helper';
import { Section } from '@/shared-ui/section.component';

import { COMPARE_MESSAGES } from './compare.const';

type Position = HeadToHeadResponse['methodology'][number]['a'];

/** Methodology positions and scores, only for rankings of a sport both competitors share (never across sports). */
export function HeadToHeadMethodology({ data }: { data: HeadToHeadResponse }) {
  const t = useText(COMPARE_MESSAGES).methodology;
  const cell = (p: Position) =>
    p?.rank ? (
      <>
        {t.position(p.rank, p.rankTied)}
        {p.score !== null && <span className="muted"> · {t.score(formatNumber(p.score))}</span>}
      </>
    ) : (
      <span className="muted">{t.notRanked}</span>
    );
  const shared = data.sharedSports.map((s) => s.name).join(', ');
  return (
    <Section title={t.title} {...(shared ? { eyebrow: t.lead(shared) } : {})}>
      {data.sharedSports.length === 0 ? (
        <p className="muted">{t.crossSport}</p>
      ) : data.methodology.length === 0 ? (
        <p className="muted">{t.empty}</p>
      ) : (
        <div className="table-wrap">
          <table className="table compare-table">
            <caption className="sr-only">{t.caption}</caption>
            <thead>
              <tr>
                <th scope="col">{t.ranking}</th>
                <th scope="col">{data.a.athlete.knownAs}</th>
                <th scope="col">{data.b.athlete.knownAs}</th>
              </tr>
            </thead>
            <tbody>
              {data.methodology.map((r) => (
                <tr key={r.snapshotId}>
                  <th scope="row">{r.title}</th>
                  <td>{cell(r.a)}</td>
                  <td>{cell(r.b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
