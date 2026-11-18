import type { SportCompetition } from '@was/shared';

import { currentText } from '@/i18n/text-for.helper';
import { useText } from '@/i18n/use-text.hook';
import { DataTable, type DataColumn } from '@/shared-ui/data-table.component';
import { LevelTag } from '@/shared-ui/level-tag.component';

import { SPORTS_MESSAGES } from './sports.const';

const COLUMNS = (): readonly DataColumn<SportCompetition>[] => {
  const t = currentText(SPORTS_MESSAGES).page;
  return [
    {
      key: 'name',
      header: t.colCompetition,
      sortValue: (c) => c.name,
      cell: (c) => (
        <>
          <b className="font-semibold">{c.name}</b>
          {c.periodicity && <div className="muted text-xs">{currentText(SPORTS_MESSAGES).periodicity[c.periodicity] ?? c.periodicity}</div>}
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
};

/** Competitions by level (world → local), sortable. */
export function SportCompetitions({ competitions }: { competitions: readonly SportCompetition[] }) {
  const t = useText(SPORTS_MESSAGES).page;
  return (
    <DataTable
      columns={COLUMNS()}
      rows={competitions}
      rowKey={(c) => c.slug}
      caption={t.competitionsCaption}
      captionHidden
      emptyText={t.noCompetitions}
      initialSort={{ key: 'level', dir: 'asc' }}
    />
  );
}
