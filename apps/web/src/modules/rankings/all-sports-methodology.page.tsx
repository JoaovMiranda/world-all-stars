import './cross-sport.css';

import { Link } from '@tanstack/react-router';
import type { CrossSportMethodologyResponse } from '@was/shared';

import { crossSportMethodologyQuery } from '@/data/endpoints/cross-sport.query';
import { useText } from '@/i18n/use-text.hook';
import { DataTable } from '@/shared-ui/data-table.component';
import { formatNumber } from '@/shared-ui/format.helper';
import { Notice } from '@/shared-ui/notice.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';

import { CROSS_SPORT_MESSAGES } from './cross-sport.const';
import { CrossSportBandBadge } from './cross-sport-band-badge.component';

type Mapping = CrossSportMethodologyResponse['rulesets'][number]['mappings'][number];

/** `/rankings/all-sports/methodology` (D07): bands S=10 A=8 B=5 C=2 D=0.5, mappings per sport, sources, limits, hashes. */
export function AllSportsMethodologyPage() {
  const t = useText(CROSS_SPORT_MESSAGES);
  const m = t.methodology;
  const query = crossSportMethodologyQuery.useQuery();
  const period = (row: Mapping) => (row.fromYear === null && row.toYear === null ? m.anyPeriod : `${row.fromYear ?? '…'}–${row.toYear ?? '…'}`);
  return (
    <PageLayout
      title={m.title}
      eyebrow={t.page.eyebrow}
      lead={m.lead}
      breadcrumb={[{ label: t.page.breadcrumb, link: { to: '/rankings' } }, { label: t.page.title, link: { to: '/rankings/all-sports' } }, { label: m.title }]}
    >
      <Notice tone="warning">
        <p>
          <b className="font-semibold">{t.page.disclaimerTitle}.</b> {t.page.disclaimer}
        </p>
      </Notice>
      <QueryBoundary query={query} loading={<SkeletonList rows={6} />}>
        {(d) => (
          <>
            <Section title={m.bandsTitle}>
              <p>{m.bandsLead}</p>
              <DataTable
                caption={m.bandsTitle}
                captionHidden
                rows={d.bands}
                rowKey={(b) => b.band}
                columns={[
                  { key: 'band', header: m.band, cell: (b) => <CrossSportBandBadge band={b.band} /> },
                  { key: 'meaning', header: m.meaning, cell: (b) => t.bands.names[b.band] },
                  { key: 'points', header: m.points, cell: (b) => formatNumber(b.points), align: 'end' },
                ]}
              />
            </Section>
            <Section title={m.howTitle}>
              <ul className="stack gap-1">
                {m.how.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Section>
            <Section title={m.sourcesTitle}>
              <p>{m.sourcesText}</p>
            </Section>
            <Section title={m.limitsTitle}>
              <ul className="stack gap-1">
                {m.limits.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Section>
            <Section title={m.mappingsTitle} eyebrow={d.rulesetVersion}>
              <p>{m.mappingsLead}</p>
              {d.rulesets.map((r) => (
                <div key={r.sport} className="stack gap-1">
                  <h3>{r.sport === 'multi-sport' ? m.olympicSport : r.name}</h3>
                  <p className="muted cross-sport-hash">
                    {r.rulesetKey} · {r.hash}
                  </p>
                  <DataTable
                    caption={`${m.mappingsTitle}: ${r.sport === 'multi-sport' ? m.olympicSport : r.name}`}
                    captionHidden
                    rows={r.mappings}
                    rowKey={(row) => `${row.kind}:${row.value}:${row.fromYear ?? ''}`}
                    columns={[
                      { key: 'value', header: m.value, cell: (row) => row.value },
                      { key: 'kind', header: m.kind, cell: (row) => m.kinds[row.kind] ?? row.kind },
                      { key: 'band', header: m.band, cell: (row) => <CrossSportBandBadge band={row.band} size="sm" /> },
                      { key: 'period', header: m.period, cell: period },
                      { key: 'note', header: m.note, cell: (row) => row.sourceNote ?? '—' },
                    ]}
                  />
                </div>
              ))}
            </Section>
            <Section title={m.reproducibilityTitle}>
              <p>{m.reproducibilityText}</p>
              <dl className="stack gap-1">
                <dt className="font-semibold">{m.inputHash}</dt>
                <dd className="cross-sport-hash">{d.inputHash}</dd>
                <dt className="font-semibold">{m.outputHash}</dt>
                <dd className="cross-sport-hash">{d.outputHash}</dd>
              </dl>
              <p className="muted">
                {m.competitors(d.competitors)} · {m.unmapped(d.unmappedTotal)}
              </p>
            </Section>
            <p>
              <Link to="/rankings/all-sports">{m.backToList}</Link>
            </p>
          </>
        )}
      </QueryBoundary>
    </PageLayout>
  );
}
