import type { EditionEvent, EditionLineup, EditionMember, EditionResult, EditionSquad } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { DataTable } from '@/shared-ui/data-table.component';
import { DateLink } from '@/shared-ui/date-link.component';
import { Section } from '@/shared-ui/section.component';

import { COMPETITIONS_MESSAGES } from './competitions.const';
import { CompetitorName } from './competitor-name.component';

function ResultsTable({ event }: { event: EditionEvent }) {
  const t = useText(COMPETITIONS_MESSAGES);
  const hasMarks = event.results.some((r) => r.mark);
  return (
    <DataTable<EditionResult>
      caption={t.resultsCaption(event.label)}
      captionHidden
      rows={event.results}
      rowKey={(r) => `${r.competitor.kind}:${r.competitor.slug ?? r.competitor.name}`}
      columns={[
        {
          key: 'rank',
          header: t.rank,
          align: 'end',
          sortValue: (r) => r.rank,
          cell: (r) => <span className="num">{r.rank === null ? '—' : `${r.rank}${r.tied ? ` (${t.tied})` : ''}`}</span>,
        },
        { key: 'competitor', header: t.competitor, sortValue: (r) => r.competitor.name, cell: (r) => <CompetitorName {...r.competitor} /> },
        ...(hasMarks ? [{ key: 'mark', header: t.mark, cell: (r: EditionResult) => r.mark ?? '—' }] : []),
        { key: 'status', header: t.result, cell: (r) => r.status },
      ]}
    />
  );
}

function SquadTable({ squad }: { squad: EditionSquad }) {
  const t = useText(COMPETITIONS_MESSAGES);
  const has = (key: 'shirtNumber' | 'position' | 'role') => squad.members.some((m) => m[key] !== null);
  return (
    <div className="stack">
      <h4>
        <CompetitorName {...squad.competitor} />
      </h4>
      <DataTable<EditionMember>
        caption={t.squadCaption(squad.competitor.name)}
        captionHidden
        rows={squad.members}
        rowKey={(m) => `${m.slug ?? m.name}`}
        columns={[
          ...(has('shirtNumber')
            ? [
                {
                  key: 'shirt',
                  header: t.shirt,
                  align: 'end' as const,
                  sortValue: (m: EditionMember) => m.shirtNumber,
                  cell: (m: EditionMember) => m.shirtNumber ?? '—',
                },
              ]
            : []),
          { key: 'name', header: t.player, sortValue: (m) => m.name, cell: (m) => <CompetitorName name={m.name} slug={m.slug} /> },
          ...(has('position') ? [{ key: 'position', header: t.position, cell: (m: EditionMember) => m.position ?? '—' }] : []),
          ...(has('role') ? [{ key: 'role', header: t.role, cell: (m: EditionMember) => m.role ?? '—' }] : []),
        ]}
      />
    </div>
  );
}

function LineupBlock({ lineup }: { lineup: EditionLineup }) {
  const t = useText(COMPETITIONS_MESSAGES);
  return (
    <div className="stack">
      {lineup.date && (
        <p className="muted">
          <DateLink date={lineup.date} />
        </p>
      )}
      <div className="grid">
        {lineup.sides.map((side) => (
          <section key={`${side.competitor.kind}:${side.competitor.name}`} aria-label={t.lineupCaption(lineup.contest, side.competitor.name)}>
            <h4>
              <CompetitorName {...side.competitor} />
            </h4>
            <ul className="stack">
              {side.players.map((p) => (
                <li key={p.slug ?? p.name}>
                  <CompetitorName name={p.name} slug={p.slug} /> <span className="muted">· {p.role}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/** One event of an edition: results, squads and final lineups (each block hidden when empty). */
export function EditionEventSection({ event, showTitle }: { event: EditionEvent; showTitle: boolean }) {
  const t = useText(COMPETITIONS_MESSAGES);
  const title = showTitle ? event.label : t.results;
  return (
    <Section title={title} eyebrow={showTitle ? t.results : undefined} id={`event-${event.id}`}>
      {event.results.length > 0 && <ResultsTable event={event} />}
      {event.lineups.length > 0 && (
        <>
          <h3>{t.lineups}</h3>
          {event.lineups.map((l) => (
            <LineupBlock key={`${l.contest}-${l.date ?? ''}`} lineup={l} />
          ))}
        </>
      )}
      {event.squads.length > 0 && (
        <>
          <h3>{t.squads}</h3>
          {event.squads.map((s) => (
            <SquadTable key={`${s.competitor.kind}:${s.competitor.name}`} squad={s} />
          ))}
        </>
      )}
    </Section>
  );
}
