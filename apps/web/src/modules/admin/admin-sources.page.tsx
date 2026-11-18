import { ADMIN_SOURCES_TAB_VALUES, type AdminSource, AdminSourcesSearchSchema, AdminSourcesTab, SOURCE_USAGE_STATUS_VALUES, type SourceUsageStatus } from '@was/shared';
import { useState } from 'react';

import { adminSourcesQuery, updateSource } from '@/data/endpoints/admin.query';
import { useText } from '@/i18n/use-text.hook';
import { DataTable } from '@/shared-ui/data-table.component';
import { DecisionBar } from '@/shared-ui/decision-bar.component';
import { FormField } from '@/shared-ui/form-field.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { Select } from '@/shared-ui/select.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { StatusFilter } from '@/shared-ui/status-filter.component';
import { Tabs } from '@/shared-ui/tabs.component';

import { ADMIN_MESSAGES } from './admin.const';
import { formatDateTime, formatDay } from './admin-format.helper';
import { AdminLayout } from './admin-layout.component';
import { ADMIN_REASON, filterByStatus, pickStatus, statusOptions } from './admin-queue.helper';
import { CollectionLinksForm } from './collection-links-form.component';
import { StatusTag } from './status-tag.component';
import { useAdminTab } from './use-admin-tab.hook';
import { useQueueState } from './use-queue-state.hook';
import { useAdminMeta } from './use-admin-meta.hook';

const statusOf = (s: AdminSource) => s.usageStatus;

function SourceActions({ s }: { s: AdminSource }) {
  const T = useText(ADMIN_MESSAGES).sources;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const update = updateSource.useMutation();
  const [usage, setUsage] = useState<SourceUsageStatus>(s.usageStatus);
  const reviewed = s.licenseReviewedAt !== null;
  return (
    <DecisionBar
      label={`${adminText.common.actions}: ${s.name}`}
      actions={[
        {
          key: 'usage',
          label: T.changeUsage,
          confirmTitle: T.changeUsageTitle(s.name),
          confirmBody: (
            <FormField label={T.usageField} required>
              {(p) => <Select {...p} value={usage} onChange={(e) => setUsage(e.target.value as SourceUsageStatus)} options={SOURCE_USAGE_STATUS_VALUES.map((v) => ({ value: v, label: meta.sourceUsage[v].label }))} />}
            </FormField>
          ),
          reason: ADMIN_REASON,
          onConfirm: (reason) => update.mutateAsync({ params: { id: s.slug }, body: { usageStatus: usage, reason } }),
        },
        {
          key: 'license',
          label: reviewed ? T.unmarkReviewed : T.markReviewed,
          confirmTitle: reviewed ? T.unmarkReviewedTitle(s.name) : T.markReviewedTitle(s.name),
          reason: ADMIN_REASON,
          onConfirm: (reason) => update.mutateAsync({ params: { id: s.slug }, body: { licenseReviewed: !reviewed, reason } }),
        },
      ]}
    />
  );
}

/** A3 Fontes: registry (usage status, license review) and athletes + links added to the collection. */
export function AdminSourcesPage() {
  const T = useText(ADMIN_MESSAGES).sources;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const { tab, setTab } = useAdminTab(AdminSourcesSearchSchema, ADMIN_SOURCES_TAB_VALUES);
  const state = useQueueState();
  const query = adminSourcesQuery.useQuery();
  return (
    <AdminLayout section="sources">
      <Tabs
        label={T.tabsLabel}
        value={tab}
        onChange={setTab}
        tabs={[
          { value: AdminSourcesTab.Registry, label: T.tabs.registry, ...(query.data ? { count: query.data.sources.length } : {}) },
          { value: AdminSourcesTab.Collection, label: T.tabs.collection, ...(query.data ? { count: query.data.queuedLinks.length } : {}) },
        ]}
      >
        {tab === AdminSourcesTab.Collection && <CollectionLinksForm />}
        <QueryBoundary query={query} loading={<SkeletonList rows={8} />}>
          {({ sources, queuedLinks }) => {
            if (tab === AdminSourcesTab.Collection) {
              return (
                <Section title={T.queuedTitle}>
                  <DataTable
                    caption={T.queuedCaption}
                    captionHidden
                    emptyText={T.queuedEmpty}
                    rows={queuedLinks}
                    rowKey={(l) => l.id}
                    columns={[
                      { key: 'athlete', header: adminText.common.athlete, cell: (l) => <b>{l.athleteName}</b>, sortValue: (l) => l.athleteName },
                      { key: 'url', header: T.links, cell: (l) => <a href={l.url} target="_blank" rel="noopener noreferrer" className="admin-wrap">{l.url}</a> },
                      { key: 'source', header: adminText.common.source, cell: (l) => l.sourceName ?? '—' },
                      { key: 'origin', header: T.origin, cell: (l) => T.originLabel[l.origin] },
                      { key: 'at', header: adminText.common.created, cell: (l) => formatDateTime(l.createdAt), sortValue: (l) => l.createdAt },
                    ]}
                  />
                </Section>
              );
            }
            const status = pickStatus(meta.sourceUsage, state.status);
            return (
              <div className="stack">
                <StatusFilter label={adminText.common.statusFilter} options={statusOptions(meta.sourceUsage, sources, statusOf)} value={status} total={sources.length} onChange={state.setStatus} />
                <DataTable
                  caption={T.caption}
                  captionHidden
                  emptyText={T.empty}
                  rows={filterByStatus(sources, status, statusOf)}
                  rowKey={(s) => s.slug}
                  columns={[
                    { key: 'name', header: T.name, cell: (s) => <a href={s.url} target="_blank" rel="noopener noreferrer"><b>{s.name}</b> ↗</a>, sortValue: (s) => s.name },
                    { key: 'license', header: T.license, cell: (s) => <span className="admin-wrap">{s.license || '—'}</span> },
                    { key: 'usage', header: T.usage, cell: (s) => <StatusTag meta={meta.sourceUsage[s.usageStatus]} />, sortValue: (s) => s.usageStatus },
                    { key: 'review', header: T.licenseReview, cell: (s) => (s.licenseReviewedAt ? T.reviewedAt(formatDay(s.licenseReviewedAt)) : <span className="muted">{T.notReviewed}</span>) },
                    { key: 'links', header: T.links, cell: (s) => s.links.length, sortValue: (s) => s.links.length, align: 'end' },
                    { key: 'actions', header: adminText.common.actions, cell: (s) => <SourceActions key={`${s.slug}-${s.usageStatus}`} s={s} /> },
                  ]}
                />
              </div>
            );
          }}
        </QueryBoundary>
      </Tabs>
    </AdminLayout>
  );
}
