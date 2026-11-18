import { AthleteProfileTab, type Notification, NotificationFilter, NotificationsSearchSchema } from '@was/shared';

import { markNotificationRead, notificationsQuery } from '@/data/endpoints/session.query';
import { currentText } from '@/i18n/text-for.helper';
import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { ButtonLink } from '@/shared-ui/button-link.component';
import { ChipToggleGroup } from '@/shared-ui/chip-toggle-group.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { formatDate } from '@/shared-ui/format.helper';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { Tag } from '@/shared-ui/tag.component';
import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';

import { AccountLayout } from './account-layout.component';
import { ACCOUNT_MESSAGES } from './account.const';

const FILTER_OPTIONS = () => {
  const t = currentText(ACCOUNT_MESSAGES).notifications;
  return [
    { value: NotificationFilter.Unread, label: t.filters['nao-lidas'] },
    { value: NotificationFilter.Read, label: t.filters.lidas },
  ];
};

const matches = (n: Notification, filter: NotificationFilter | undefined) =>
  filter === NotificationFilter.Unread ? !n.read : filter === NotificationFilter.Read ? n.read : true;

function NotificationItem({ n, onRead, busy }: { n: Notification; onRead: () => void; busy: boolean }) {
  const t = useText(ACCOUNT_MESSAGES).notifications;
  const title = t.kind[n.kind](n.actor ?? t.someone, n.athlete?.knownAs ?? '');
  return (
    <li className={n.read ? 'account-item' : 'account-item is-unread'}>
      <span className={n.read ? 'read-dot' : 'unread-dot'} aria-hidden="true" />
      <div className="account-item-body">
        <p className="account-item-title">
          {!n.read && (
            <>
              <Tag tone="gold">{t.unreadBadge}</Tag>{' '}
            </>
          )}
          {title}
        </p>
        {n.excerpt && <p className="muted">“{n.excerpt}”</p>}
        <span className="account-item-meta">{formatDate(n.at.slice(0, 10))}</span>
      </div>
      <div className="account-item-actions">
        {n.athlete && (
          <ButtonLink to="/athletes/$slug" params={{ slug: n.athlete.slug }} search={{ tab: AthleteProfileTab.Comments }} size="sm" onClick={() => !n.read && onRead()}>
            {t.open}
            {/* Repeated per item: the notification title tells them apart for screen readers (WCAG 2.4.4). */}
            <span className="sr-only">: {title}</span>
          </ButtonLink>
        )}
        {!n.read && (
          <Button size="sm" variant="ghost" onClick={onRead} disabled={busy}>
            {t.markRead}
            <span className="sr-only">: {title}</span>
          </Button>
        )}
      </div>
    </li>
  );
}

function NotificationsContent() {
  const t = useText(ACCOUNT_MESSAGES).notifications;
  const { filters, setFilter, reset } = useUrlFilters(NotificationsSearchSchema);
  const query = notificationsQuery.useQuery();
  const mark = markNotificationRead.useMutation();
  const markAll = (items: readonly Notification[]) => {
    for (const n of items.filter((i) => !i.read)) mark.mutate({ params: { id: n.id } });
  };

  return (
    <QueryBoundary
      query={query}
      loading={<SkeletonList rows={5} className="h-20 w-full" />}
      isEmpty={(d) => d.items.length === 0}
      empty={
        <EmptyState title={t.emptyTitle} mark="◇">
          {t.emptyText}
        </EmptyState>
      }
    >
      {({ items, unread }) => {
        const shown = items.filter((n) => matches(n, filters.filtro));
        return (
          <Section
            title={t.unread(unread)}
            actions={
              unread > 0 && (
                <Button size="sm" onClick={() => markAll(items)} disabled={mark.isPending}>
                  {t.markAll}
                </Button>
              )
            }
          >
            <div className="mb-4">
              <ChipToggleGroup label={t.filterLabel} options={FILTER_OPTIONS()} value={filters.filtro} onChange={(v) => setFilter('filtro', v)} />
            </div>
            {shown.length ? (
              <ul className="account-list" aria-live="polite">
                {shown.map((n) => (
                  <NotificationItem key={n.id} n={n} busy={mark.isPending} onRead={() => mark.mutate({ params: { id: n.id } })} />
                ))}
              </ul>
            ) : (
              <EmptyState compact title={t.emptyFilteredTitle} action={<Button onClick={reset}>{t.showAll}</Button>} />
            )}
          </Section>
        );
      }}
    </QueryBoundary>
  );
}

/** E4 Notifications (docs 09/20): replies to my comments, read/unread filter in the URL, mark as read. */
export function NotificationsPage() {
  const t = useText(ACCOUNT_MESSAGES).notifications;
  return (
    <AccountLayout title={t.title} lead={t.lead}>
      <NotificationsContent />
    </AccountLayout>
  );
}
