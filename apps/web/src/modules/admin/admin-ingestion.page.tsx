import { ADMIN_INGESTION_TAB_VALUES, type AdminIngestionRun, AdminIngestionSearchSchema, AdminIngestionTab, INGESTION_GATE_VALUES } from '@was/shared';

import { adminIngestionQuery, runIngestion } from '@/data/endpoints/admin.query';
import { useText } from '@/i18n/use-text.hook';
import { DataTable } from '@/shared-ui/data-table.component';
import { DecisionBar } from '@/shared-ui/decision-bar.component';
import { FactList } from '@/shared-ui/fact-list.component';
import { formatNumber } from '@/shared-ui/format.helper';
import { KpiGrid } from '@/shared-ui/kpi-grid.component';
import { MeterList } from '@/shared-ui/meter-list.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { ReviewQueue } from '@/shared-ui/review-queue.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { StatTile } from '@/shared-ui/stat-tile.component';
import { StatusFilter } from '@/shared-ui/status-filter.component';
import { Tabs } from '@/shared-ui/tabs.component';

import { ADMIN_MESSAGES } from './admin.const';
import { formatDateTime } from './admin-format.helper';
import { AdminLayout } from './admin-layout.component';
import { filterByStatus, pickStatus, statusOptions } from './admin-queue.helper';
import { StatusTag } from './status-tag.component';
import { useAdminTab } from './use-admin-tab.hook';
import { useQueueState } from './use-queue-state.hook';
import { useAdminMeta } from './use-admin-meta.hook';

const statusOf = (r: AdminIngestionRun) => r.status;
const skippedOf = (r: AdminIngestionRun) => INGESTION_GATE_VALUES.reduce((s, g) => s + (r.skipped[g] ?? 0), 0);

function RunDetail({ run }: { run: AdminIngestionRun }) {
  const T = useText(ADMIN_MESSAGES).ingestion;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const skipped = skippedOf(run);
  return (
    <div className="admin-detail">
      <div className="admin-detail-head">
        <StatusTag meta={meta.runStatus[run.status]} />
      </div>
      <h2>{run.jobKey}</h2>
      <FactList
        variant="split"
        items={[
          { key: 'src', term: adminText.common.source, detail: run.source?.name ?? adminText.common.noSource },
          { key: 'mode', term: T.mode, detail: run.mode },
          { key: 'start', term: T.duration, detail: formatDateTime(run.startedAt) },
          { key: 'checked', term: T.checked, detail: run.checked },
          { key: 'updated', term: T.updated, detail: run.updated },
          { key: 'errors', term: T.errors, detail: run.errors },
          { key: 'tokens', term: T.tokens, detail: formatNumber(run.tokens) },
        ]}
      />
      <div>
        <h3 className="label">{T.gates}</h3>
        <MeterList
          label={T.gates}
          items={INGESTION_GATE_VALUES.map((g) => ({
            key: g,
            label: meta.gate[g],
            percent: skipped ? ((run.skipped[g] ?? 0) / skipped) * 100 : 0,
            valueText: run.skipped[g] ?? 0,
          }))}
        />
      </div>
      <div>
        <h3 className="label">{T.logs}</h3>
        {run.logs.length ? (
          <ul className="admin-log">
            {run.logs.map((l, i) => (
              <li key={i} className={`lvl-${l.level}`}>
                [{l.level}] {l.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{T.noLogs}</p>
        )}
      </div>
    </div>
  );
}

function RunsTab({ runs }: { runs: readonly AdminIngestionRun[] }) {
  const T = useText(ADMIN_MESSAGES).ingestion;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const state = useQueueState();
  const run = runIngestion.useMutation();
  const status = pickStatus(meta.runStatus, state.status);
  const jobs = [...new Map(runs.map((r) => [r.jobKey, r])).values()];
  return (
    <div className="stack">
      <KpiGrid columns={4} label={T.kpis}>
        <StatTile label={T.runsKpi} value={runs.length} />
        <StatTile label={T.tokensKpi} value={runs.reduce((s, r) => s + r.tokens, 0)} />
        <StatTile label={T.skippedKpi} value={runs.reduce((s, r) => s + skippedOf(r), 0)} />
        <StatTile label={T.errorsKpi} value={runs.reduce((s, r) => s + r.errors, 0)} />
      </KpiGrid>
      <Section title={T.jobsTitle} headingLevel={2}>
        <DataTable
          caption={T.jobsLabel}
          captionHidden
          rows={jobs}
          rowKey={(r) => r.jobKey}
          columns={[
            { key: 'job', header: T.jobsTitle, cell: (r) => <span className="admin-wrap">{r.jobKey}</span> },
            { key: 'last', header: T.duration, cell: (r) => formatDateTime(r.startedAt) },
            { key: 'status', header: T.status, cell: (r) => <StatusTag meta={meta.runStatus[r.status]} /> },
            {
              key: 'run',
              header: adminText.common.actions,
              cell: (r) => (
                <DecisionBar
                  label={T.runNowTitle(r.jobKey)}
                  actions={[{ key: 'run', label: T.runNow, confirmTitle: T.runNowTitle(r.jobKey), confirmBody: <p className="muted">{T.runNowText}</p>, onConfirm: () => run.mutateAsync({ body: { jobKey: r.jobKey } }) }]}
                />
              ),
            },
          ]}
        />
      </Section>
      <StatusFilter label={adminText.common.statusFilter} options={statusOptions(meta.runStatus, runs, statusOf)} value={status} total={runs.length} onChange={state.setStatus} />
      <ReviewQueue
        label={T.runsLabel}
        items={filterByStatus(runs, status, statusOf)}
        getKey={(r) => r.id}
        selectedKey={state.item}
        onSelect={state.setItem}
        emptyTitle={T.empty}
        emptyText={T.emptyText}
        renderItem={(r) => (
          <>
            <span className="review-queue-item-head">
              <b>{r.jobKey}</b>
              <StatusTag meta={meta.runStatus[r.status]} />
            </span>
            <small>
              {formatDateTime(r.startedAt)} · {T.checked} {r.checked} · {T.tokens} {formatNumber(r.tokens)}
            </small>
          </>
        )}
        renderDetail={(r) => <RunDetail run={r} />}
      />
    </div>
  );
}

/** A2 Ingestão: runs per job (gates, tokens, logs, "rodar agora") and the AI extraction queue. */
export function AdminIngestionPage() {
  const T = useText(ADMIN_MESSAGES).ingestion;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const { tab, setTab } = useAdminTab(AdminIngestionSearchSchema, ADMIN_INGESTION_TAB_VALUES);
  const query = adminIngestionQuery.useQuery();
  return (
    <AdminLayout section="ingestion">
      <Tabs
        label={T.tabsLabel}
        value={tab}
        onChange={setTab}
        tabs={[
          { value: AdminIngestionTab.Runs, label: T.tabs.runs, ...(query.data ? { count: query.data.runs.length } : {}) },
          { value: AdminIngestionTab.Queue, label: T.tabs.queue, ...(query.data ? { count: query.data.queue.length } : {}) },
        ]}
      >
        <QueryBoundary query={query} loading={<SkeletonList rows={6} />}>
          {(data) =>
            tab === AdminIngestionTab.Runs ? (
              <RunsTab runs={data.runs} />
            ) : (
              <DataTable
                caption={T.queueCaption}
                emptyText={T.queueEmpty}
                rows={data.queue}
                rowKey={(q) => q.id}
                columns={[
                  { key: 'entity', header: adminText.common.athlete, cell: (q) => <b>{q.entityLabel}</b>, sortValue: (q) => q.entityLabel },
                  { key: 'section', header: T.section, cell: (q) => <code className="admin-wrap">{q.section}</code> },
                  { key: 'source', header: adminText.common.source, cell: (q) => q.sourceName ?? adminText.common.noSource },
                  { key: 'status', header: T.status, cell: (q) => q.status },
                  { key: 'gate', header: T.gate, cell: (q) => (q.skippedAtGate ? meta.gate[q.skippedAtGate] : '—') },
                  { key: 'tokens', header: T.tokensInOut, cell: (q) => `${formatNumber(q.tokensIn)} / ${formatNumber(q.tokensOut)}`, align: 'end' },
                  { key: 'at', header: adminText.common.created, cell: (q) => formatDateTime(q.createdAt), sortValue: (q) => q.createdAt },
                ]}
              />
            )
          }
        </QueryBoundary>
      </Tabs>
    </AdminLayout>
  );
}
