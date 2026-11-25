import type { AthleteProfile, DivisionClass } from '@was/shared';
import { useMemo } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { DataTable } from '@/shared-ui/data-table.component';
import { FactList } from '@/shared-ui/fact-list.component';
import { Medal } from '@/shared-ui/medal.component';
import { Section } from '@/shared-ui/section.component';
import { Tag } from '@/shared-ui/tag.component';

import { ATHLETE_PROFILE_MESSAGES } from '../athletes.const';
import { BJJ_PODIUM } from './bjj-division.const';
import { bjjResults, bjjSummary } from './bjj-division.helper';

/**
 * BJJ classes of the athlete (T2.4): belt (always as text, never colour only), gi/no-gi, weight classes, absolute and
 * podium placements, plus every result with its division. Belts and modes are explained for newcomers.
 */
export function BjjDivisions({ profile }: { profile: AthleteProfile }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).bjj;
  const results = useMemo(() => bjjResults(profile), [profile]);
  const summary = useMemo(() => bjjSummary(results), [results]);
  const belt = (c: DivisionClass | null) => (c ? (T.belts[c.value] ?? T.beltValue(c.label)) : T.notRecorded);
  const mode = (c: DivisionClass | null) => (c ? (T.modes[c.value] ?? c.label) : T.notRecorded);
  const hasClasses = results.some((r) => r.belt || r.gi || r.weight);
  const list = (items: string[]) => (items.length ? items.join(' · ') : T.notRecorded);

  return (
    <Section title={T.title} eyebrow={T.eyebrow}>
      <p className="bjj-intro muted">{T.intro}</p>
      <FactList
        variant="split"
        label={T.summaryLabel}
        items={[
          { key: 'belt', term: T.belt, detail: list(summary.belts.map((b) => belt(b))) },
          { key: 'mode', term: T.mode, detail: list(summary.gi.map((g) => T.modeCount(mode(g.mode), g.count))) },
          { key: 'weight', term: T.weights, detail: list(summary.weights.map((w) => w.label)) },
          { key: 'absolute', term: T.absolute, detail: T.absoluteCount(summary.absolute) },
          {
            key: 'placements',
            term: T.placements,
            detail: (
              <span className="medal-row">
                {BJJ_PODIUM.map(({ place, metal }) => (
                  <span key={place} className="bjj-place">
                    <Medal metal={metal}>{summary.podium[place - 1]}</Medal>
                    <span>{T.placement(place)}</span>
                  </span>
                ))}
              </span>
            ),
          },
        ]}
      />
      {!hasClasses && results.length > 0 && <p className="vote-foot">{T.classesMissing}</p>}
      <DataTable
        caption={T.resultsCaption}
        captionHidden
        rows={results}
        rowKey={(r) => r.id}
        emptyText={T.empty}
        initialSort={{ key: 'year', dir: 'desc' }}
        columns={[
          { key: 'competition', header: T.competition, cell: (r) => r.competition, sortValue: (r) => r.competition },
          { key: 'year', header: T.year, cell: (r) => r.year, sortValue: (r) => r.year, align: 'end' },
          { key: 'belt', header: T.belt, cell: (r) => belt(r.belt), sortValue: (r) => r.belt?.value ?? null },
          { key: 'mode', header: T.mode, cell: (r) => mode(r.gi), sortValue: (r) => r.gi?.value ?? null },
          {
            key: 'weight',
            header: T.weight,
            cell: (r) => (r.absolute ? <Tag tone="gold">{T.absolute}</Tag> : (r.weight?.label ?? T.notRecorded)),
            sortValue: (r) => r.weight?.label ?? null,
          },
          { key: 'sex', header: T.sex, cell: (r) => (r.sex ? (T.sexes[r.sex.value] ?? r.sex.label) : T.notRecorded) },
          {
            key: 'placement',
            header: T.placements,
            cell: (r) => (r.placement ? T.placement(r.placement) : T.notRecorded),
            sortValue: (r) => r.placement,
            align: 'end',
          },
        ]}
      />
    </Section>
  );
}
