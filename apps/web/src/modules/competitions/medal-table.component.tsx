import type { MedalTableRow } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { DataTable } from '@/shared-ui/data-table.component';
import { Section } from '@/shared-ui/section.component';

import { COMPETITIONS_MESSAGES } from './competitions.const';

/** Medal table of a multi-event edition (hidden when empty). */
export function MedalTable({ rows }: { rows: readonly MedalTableRow[] }) {
  const t = useText(COMPETITIONS_MESSAGES);
  if (!rows.length) return null;
  const count = (key: 'gold' | 'silver' | 'bronze' | 'total', header: string) => ({
    key,
    header,
    align: 'end' as const,
    sortValue: (r: MedalTableRow) => r[key],
    cell: (r: MedalTableRow) => <span className="num">{r[key]}</span>,
  });
  return (
    <Section title={t.medalTable} id="medals">
      <DataTable<MedalTableRow>
        caption={t.medalCaption}
        captionHidden
        rows={rows}
        rowKey={(r) => r.nation.code}
        columns={[
          {
            key: 'nation',
            header: t.nation,
            sortValue: (r) => r.nation.name,
            cell: (r) => (
              <>
                {r.nation.flag && <span aria-hidden="true">{r.nation.flag} </span>}
                {r.nation.name}
              </>
            ),
          },
          count('gold', t.gold),
          count('silver', t.silver),
          count('bronze', t.bronze),
          count('total', t.total),
        ]}
      />
    </Section>
  );
}
