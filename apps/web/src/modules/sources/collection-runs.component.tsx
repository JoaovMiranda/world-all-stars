import type { CollectionRun } from '@was/shared';

import { DataTable, type DataColumn } from '@/shared-ui/data-table.component';
import { formatNumber, instantFormat } from '@/shared-ui/format.helper';

import { SOURCES_TEXT } from './sources.const';

const t = SOURCES_TEXT.runs;

const COLUMNS: readonly DataColumn<CollectionRun>[] = [
  { key: 'startedAt', header: t.colStarted, sortValue: (r) => r.startedAt, cell: (r) => <span className="num">{instantFormat({ dateStyle: 'short', timeStyle: 'short' }).format(new Date(r.startedAt))}</span> },
  { key: 'mode', header: t.colMode, cell: (r) => r.mode },
  { key: 'checked', header: t.colChecked, align: 'end', cell: (r) => formatNumber(r.checked) },
  { key: 'unchanged', header: t.colUnchanged, align: 'end', cell: (r) => <b>{formatNumber(r.unchanged)}</b> },
  { key: 'validated', header: t.colValidated, align: 'end', cell: (r) => formatNumber(r.validated) },
  { key: 'accepted', header: t.colAccepted, align: 'end', cell: (r) => formatNumber(r.factsAccepted) },
  { key: 'rejected', header: t.colRejected, align: 'end', cell: (r) => formatNumber(r.factsRejected) },
  { key: 'tokens', header: t.colTokens, align: 'end', sortValue: (r) => r.extractorTokens, cell: (r) => <b>{formatNumber(r.extractorTokens)}</b> },
];

/** Runs of the AI-assisted collection: gates passed, facts accepted/discarded, extractor tokens (0 when unchanged). */
export function CollectionRuns({ runs }: { runs: readonly CollectionRun[] }) {
  return <DataTable columns={COLUMNS} rows={runs} rowKey={(r) => r.startedAt} caption={t.caption} captionHidden emptyText={t.empty} />;
}
