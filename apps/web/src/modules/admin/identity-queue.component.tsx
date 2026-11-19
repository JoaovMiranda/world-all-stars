import type { AdminIdentityCandidate } from '@was/shared';

import { adminIdentitiesQuery, decideIdentity } from '@/data/endpoints/admin.query';
import { useText } from '@/i18n/use-text.hook';
import { DecisionBar } from '@/shared-ui/decision-bar.component';
import { FactList } from '@/shared-ui/fact-list.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { ReviewQueue } from '@/shared-ui/review-queue.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { Tag } from '@/shared-ui/tag.component';

import { ADMIN_MESSAGES } from './admin.const';
import { formatDateTime } from './admin-format.helper';
import { ADMIN_REASON } from './admin-queue.helper';
import type { QueueState } from './queue-state.type';

function IdentityDetail({ c }: { c: AdminIdentityCandidate }) {
  const T = useText(ADMIN_MESSAGES).identities;
  const common = useText(ADMIN_MESSAGES).common;
  const decide = decideIdentity.useMutation();
  const send = (decision: 'match' | 'create' | 'reject', entityId?: string) => (reason: string) =>
    decide.mutateAsync({ params: { id: c.id }, body: { decision, reason, ...(entityId ? { entityId } : {}) } });
  return (
    <div className="admin-detail">
      <div className="admin-detail-head">
        <Tag tone={c.status === 'pending' ? 'info' : 'soft'}>{c.status}</Tag>
        <Tag tone="soft">{T.confidence(c.confidence)}</Tag>
      </div>
      <h2>{c.discoveredName}</h2>
      <FactList
        variant="split"
        items={[
          { key: 'provider', term: T.provider, detail: <code>{c.provider}</code> },
          ...(c.sport ? [{ key: 'sport', term: 'Sport', detail: c.sport }] : []),
          { key: 'ids', term: T.ids, detail: Object.entries(c.externalIds).map(([k, v]) => `${k}: ${v}`).join(' · ') || '—' },
          ...(c.documentUrl ? [{ key: 'doc', term: T.document, detail: <a href={c.documentUrl} target="_blank" rel="noreferrer">{c.documentUrl}</a> }] : []),
          { key: 'created', term: common.created, detail: formatDateTime(c.createdAt) },
        ]}
      />
      <h3 className="label mt-3">{T.candidates}</h3>
      {c.candidates.length ? (
        <ul className="stack gap-1.5">
          {c.candidates.map((x) => (
            <li key={x.id}>
              <a href={`/athletes/${x.slug}`}>{x.name}</a> · {T.confidence(x.confidence)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{T.noCandidates}</p>
      )}
      {c.status === 'pending' ? (
        <DecisionBar
          label={T.decisionLabel}
          actions={[
            ...c.candidates.slice(0, 2).map((x) => ({ key: `match-${x.id}`, label: T.match(x.name), variant: 'primary' as const, confirmTitle: T.matchTitle, reason: ADMIN_REASON, onConfirm: send('match', x.id) })),
            { key: 'create', label: T.create, variant: 'secondary' as const, confirmTitle: T.createTitle, reason: ADMIN_REASON, onConfirm: send('create') },
            { key: 'reject', label: T.reject, variant: 'danger' as const, confirmTitle: T.rejectTitle, reason: ADMIN_REASON, onConfirm: send('reject') },
          ]}
        />
      ) : (
        <p className="muted">{T.decided}</p>
      )}
    </div>
  );
}

/** A1 · identities: ambiguous competitors from the collection (never merged on a name alone, handoff v3 §7.1). */
export function IdentityQueue({ state }: { state: QueueState }) {
  const T = useText(ADMIN_MESSAGES).identities;
  const query = adminIdentitiesQuery.useQuery();
  return (
    <QueryBoundary query={query} loading={<SkeletonList rows={6} />}>
      {(data) => (
        <ReviewQueue
          label={T.queueLabel}
          items={data.items}
          getKey={(c) => c.id}
          selectedKey={state.item}
          onSelect={state.setItem}
          renderItem={(c) => (
            <>
              <b>{c.discoveredName}</b>
              <small className="muted">
                {c.provider} · {T.confidence(c.confidence)}
              </small>
            </>
          )}
          renderDetail={(c) => <IdentityDetail c={c} />}
          emptyTitle={T.empty}
          emptyText={T.emptyText}
        />
      )}
    </QueryBoundary>
  );
}
