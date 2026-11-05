import type { SportCompetition } from '@was/shared';

import { DataTable, type DataColumn } from '@/shared-ui/data-table.component';
import { LevelTag } from '@/shared-ui/level-tag.component';

import { PERIODICITY_LABEL, SPORTS_TEXT } from './sports.const';

const t = SPORTS_TEXT.page;

const COLUMNS: readonly DataColumn<SportCompetition>[] = [
  {
    key: 'name',
    header: t.colCompetition,
    sortValue: (c) => c.name,
    cell: (c) => (
      <>
        <b className="font-semibold">{c.name}</b>
        {c.periodicity && <div className="muted text-xs">{PERIODICITY_LABEL[c.periodicity] ?? c.periodicity}</div>}
      </>
    ),
  },
  {
    key: 'level',
    header: t.colLevel,
    sortValue: (c) => c.levelOrder,
    cell: (c) => <LevelTag level={c.level} />,
  },
  {
    key: 'org',
    header: t.colOrganizer,
    sortValue: (c) => c.org,
    cell: (c) => c.org,
  },
  {
    key: 'editions',
    header: t.colEditions,
    align: 'end',
    sortValue: (c) => c.editions,
    cell: (c) => c.editions,
  },
  {
    key: 'winners',
    header: t.colWinners,
    align: 'end',
    sortValue: (c) => c.winnersInDb,
    cell: (c) => c.winnersInDb,
  },
];

/** Competitions by level (world → local), sortable. */
export function SportCompetitions({ competitions }: { competitions: readonly SportCompetition[] }) {
  return (
    <DataTable
      columns={COLUMNS}
      rows={competitions}
      rowKey={(c) => c.slug}
      caption={t.competitionsCaption}
      captionHidden
      emptyText={t.noCompetitions}
      initialSort={{ key: 'level', dir: 'asc' }}
    />
  );
}
