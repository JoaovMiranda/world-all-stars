import '../rankings/cross-sport.css';

import { Link } from '@tanstack/react-router';
import type { HeadToHeadResponse, HeadToHeadSide } from '@was/shared';
import type { ReactNode } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { ATHLETE_PROFILE_MESSAGES } from '@/modules/athletes/athletes.const';
import { CROSS_SPORT_MESSAGES } from '@/modules/rankings/cross-sport.const';
import { CrossSportBandBadge } from '@/modules/rankings/cross-sport-band-badge.component';
import { formatNumber } from '@/shared-ui/format.helper';

import { COMPARE_MESSAGES } from './compare.const';

/** Side-by-side table: one row per criterion (row header), one column per competitor (column header). */
export function HeadToHeadTable({ data }: { data: HeadToHeadResponse }) {
  const t = useText(COMPARE_MESSAGES).table;
  const cs = useText(CROSS_SPORT_MESSAGES);
  const types = useText(ATHLETE_PROFILE_MESSAGES).analysis.resultType;
  const sides = [data.a, data.b] as const;
  const list = (items: readonly [key: string, node: ReactNode][]) =>
    items.length ? (
      <ul className="compare-cell-list">
        {items.map(([key, node]) => (
          <li key={key}>{node}</li>
        ))}
      </ul>
    ) : (
      <span className="muted">{t.none}</span>
    );
  const rows: [key: string, label: string, cell: (s: HeadToHeadSide) => ReactNode][] = [
    ['sports', t.sports, (s) => s.sports.map((x) => x.name).join(', ')],
    [
      'band',
      t.band,
      (s) =>
        s.band.band ? (
          <span className="compare-band">
            <CrossSportBandBadge band={s.band.band} size="sm" />
            <span>
              {cs.bands.names[s.band.band]} · {cs.bands.pointsLong(formatNumber(s.band.points))}
            </span>
          </span>
        ) : (
          <span className="muted">{t.noBand}</span>
        ),
    ],
    [
      'band-items',
      t.bandItems,
      (s) =>
        list([
          ...s.band.items.map((i): [string, ReactNode] => [i.evidenceId, `${i.band} · ${i.label}${i.year !== null ? ` ${i.year}` : ''}`]),
          ...(s.band.pendingReview > 0
            ? [
                [
                  'pending',
                  <span key="pending" className="muted">
                    {t.pending(s.band.pendingReview)}
                  </span>,
                ] as [string, ReactNode],
              ]
            : []),
        ]),
    ],
    [
      'legacy',
      t.legacy,
      (s) => (
        <>
          {cs.legacy.levels[s.legacy.level] ?? s.legacy.level}
          <br />
          <span className="muted">{t.legacyScore(formatNumber(s.legacy.score))}</span>
        </>
      ),
    ],
    ['titles', t.titles, (s) => list(s.titles.map((x): [string, ReactNode] => [x.type, t.count(types[x.type] ?? x.type, x.count)]))],
    [
      'sources',
      t.sources,
      (s) =>
        list(
          s.sources.map((x): [string, ReactNode] => [
            x.url,
            <a key={x.url} href={x.url} rel="noopener">
              {x.name}
            </a>,
          ]),
        ),
    ],
  ];
  return (
    <div className="table-wrap">
      <table className="table compare-table">
        <caption className="sr-only">{t.caption(data.a.athlete.knownAs, data.b.athlete.knownAs)}</caption>
        <thead>
          <tr>
            <th scope="col">{t.criterion}</th>
            {sides.map((s) => (
              <th key={s.athlete.slug} scope="col">
                <Link to="/athletes/$slug" params={{ slug: s.athlete.slug }}>
                  {s.athlete.knownAs}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([key, label, cell]) => (
            <tr key={key}>
              <th scope="row">{label}</th>
              {sides.map((s) => (
                <td key={s.athlete.slug}>{cell(s)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
