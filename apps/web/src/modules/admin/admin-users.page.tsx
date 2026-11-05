import { ADMIN_USERS_TAB_VALUES, type AdminUser, AdminUsersSearchSchema, AdminUsersTab, UserRole, includesNormalized } from '@was/shared';

import { adminUsersQuery, updateUser } from '@/data/endpoints/admin.query';
import { useSession } from '@/session/use-session.hook';
import { DataTable } from '@/shared-ui/data-table.component';
import { type DecisionAction, DecisionBar } from '@/shared-ui/decision-bar.component';
import { FilterBar } from '@/shared-ui/filter-bar.component';
import { formatNumber } from '@/shared-ui/format.helper';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { SearchInput } from '@/shared-ui/search-input.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { StatusFilter } from '@/shared-ui/status-filter.component';
import { Tabs } from '@/shared-ui/tabs.component';
import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';
import { useUrlSearchText } from '@/shared-ui/use-url-search-text.hook';

import { ADMIN_TEXT } from './admin.const';
import { formatDateTime } from './admin-format.helper';
import { AUDIT_ACTION_LABEL, type StatusMeta, USER_ROLE_META } from './admin-labels.const';
import { AdminLayout } from './admin-layout.component';
import { ADMIN_REASON, filterByStatus, pickStatus, statusOptions } from './admin-queue.helper';
import { StatusTag } from './status-tag.component';
import { useAdminTab } from './use-admin-tab.hook';

const T = ADMIN_TEXT.users;
type AccountFilter = UserRole | 'banned';
const ACCOUNT_META: Record<AccountFilter, StatusMeta> = { ...USER_ROLE_META, banned: { label: T.banned, tone: 'danger' } };
const accountOf = (u: AdminUser): AccountFilter => (u.bannedAt ? 'banned' : u.role);

function UserActions({ u, isMe }: { u: AdminUser; isMe: boolean }) {
  const update = updateUser.useMutation();
  const send = (body: { role?: UserRole; banned?: boolean }) => (reason: string) => update.mutateAsync({ params: { id: u.id }, body: { ...body, reason } });
  const actions: DecisionAction[] = [
    u.role === UserRole.Admin
      ? { key: 'role', label: T.demote, confirmTitle: T.demoteTitle(u.name), reason: ADMIN_REASON, disabled: isMe, onConfirm: send({ role: UserRole.Reader }) }
      : { key: 'role', label: T.promote, confirmTitle: T.promoteTitle(u.name), reason: ADMIN_REASON, disabled: isMe || Boolean(u.bannedAt), onConfirm: send({ role: UserRole.Admin }) },
    u.bannedAt
      ? { key: 'ban', label: T.unban, confirmTitle: T.unbanTitle(u.name), reason: ADMIN_REASON, disabled: isMe, onConfirm: send({ banned: false }) }
      : { key: 'ban', label: T.ban, variant: 'danger', confirmTitle: T.banTitle(u.name), confirmBody: <p className="muted">{T.banText}</p>, reason: ADMIN_REASON, disabled: isMe, onConfirm: send({ banned: true }) },
  ];
  return <DecisionBar label={`${ADMIN_TEXT.common.actions}: ${u.name}`} actions={actions} />;
}

/** A4 Usuários e papéis: accounts (search, role/banned filter, promote/ban with reason) and the audit log. */
export function AdminUsersPage() {
  const { tab, setTab } = useAdminTab(AdminUsersSearchSchema, ADMIN_USERS_TAB_VALUES);
  const { filters, setFilter, setFilters } = useUrlFilters(AdminUsersSearchSchema);
  const [text, setText] = useUrlSearchText(filters.q, (q) => setFilter('q', q));
  const { user } = useSession();
  const query = adminUsersQuery.useQuery();
  return (
    <AdminLayout section="users">
      <Tabs
        label={T.tabsLabel}
        value={tab}
        onChange={setTab}
        tabs={[
          { value: AdminUsersTab.Users, label: T.tabs.users, ...(query.data ? { count: query.data.items.length } : {}) },
          { value: AdminUsersTab.Audit, label: T.tabs.audit, ...(query.data ? { count: query.data.audit.length } : {}) },
        ]}
      >
        <QueryBoundary query={query} loading={<SkeletonList rows={8} />}>
          {({ items, audit }) => {
            if (tab === AdminUsersTab.Audit) {
              return (
                <DataTable
                  caption={T.auditCaption}
                  emptyText={T.auditEmpty}
                  rows={audit}
                  rowKey={(a) => a.id}
                  initialSort={{ key: 'at', dir: 'desc' }}
                  columns={[
                    { key: 'at', header: T.when, cell: (a) => formatDateTime(a.at), sortValue: (a) => a.at },
                    { key: 'actor', header: T.actor, cell: (a) => a.actor, sortValue: (a) => a.actor },
                    { key: 'action', header: T.action, cell: (a) => AUDIT_ACTION_LABEL[a.action], sortValue: (a) => a.action },
                    { key: 'target', header: T.target, cell: (a) => <span className="admin-wrap">{a.target}</span> },
                    { key: 'reason', header: ADMIN_TEXT.common.reason, cell: (a) => <span className="admin-wrap">{a.reason ?? '—'}</span> },
                  ]}
                />
              );
            }
            const status = pickStatus(ACCOUNT_META, filters.status);
            const matching = filters.q ? items.filter((u) => includesNormalized(u.name, filters.q) || includesNormalized(u.email, filters.q)) : items;
            const rows = filterByStatus(matching, status, accountOf);
            return (
              <div className="stack">
                <FilterBar label={T.roleFilter} resultCount={rows.length} activeCount={Number(Boolean(filters.q)) + Number(Boolean(filters.status))} onReset={() => setFilters({ q: undefined, status: undefined })}>
                  <SearchInput inline className="admin-search" label={T.search} placeholder={T.search} value={text} onChange={(e) => setText(e.target.value)} />
                  <StatusFilter label={T.roleFilter} options={statusOptions(ACCOUNT_META, matching, accountOf)} value={status} total={matching.length} onChange={(s) => setFilter('status', s)} />
                </FilterBar>
                <DataTable
                  caption={T.caption}
                  captionHidden
                  emptyText={T.empty}
                  rows={rows}
                  rowKey={(u) => u.id}
                  columns={[
                    { key: 'name', header: T.name, cell: (u) => <b>{u.name}{user?.email === u.email && <small className="muted"> ({T.you})</small>}</b>, sortValue: (u) => u.name },
                    { key: 'email', header: ADMIN_TEXT.common.email, cell: (u) => <span className="admin-wrap">{u.email}</span> },
                    { key: 'role', header: T.role, cell: (u) => <StatusTag meta={USER_ROLE_META[u.role]} />, sortValue: (u) => u.role },
                    { key: 'votes', header: T.votes, cell: (u) => formatNumber(u.tierVotesCount), sortValue: (u) => u.tierVotesCount, align: 'end' },
                    { key: 'comments', header: T.comments, cell: (u) => formatNumber(u.commentsCount), sortValue: (u) => u.commentsCount, align: 'end' },
                    { key: 'status', header: T.status, cell: (u) => <StatusTag meta={u.bannedAt ? ACCOUNT_META.banned : { label: T.active, tone: 'success' }} /> },
                    { key: 'actions', header: ADMIN_TEXT.common.actions, cell: (u) => <UserActions u={u} isMe={user?.email === u.email} /> },
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
