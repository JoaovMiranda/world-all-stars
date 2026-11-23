import './admin.css';
import './admin-merge.css';

import { useState } from 'react';

import { mergeEntities, mergePreviewQuery } from '@/data/endpoints/admin-merge.query';
import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { ConfirmDialog } from '@/shared-ui/confirm-dialog.component';
import { Notice } from '@/shared-ui/notice.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { RequireSession } from '@/shared-ui/require-session.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';

import { ADMIN_MESSAGES } from './admin.const';
import { ADMIN_MERGE_MESSAGES } from './admin-merge.const';
import { MergeCompare } from './admin-merge-compare.component';
import { MergeHistory } from './admin-merge-history.component';
import { MergePicker } from './admin-merge-picker.component';
import {
  chooseMergeField,
  emptyMergeSelection,
  isMergeReady,
  mergeRequestOf,
  mergeWinnerOf,
  pickMergeSide,
  swapMergeSides,
} from './admin-merge-selection.helper';
import { AdminNav } from './admin-nav.component';
import { ADMIN_REASON } from './admin-queue.const';

/** D14 merge/unmerge: pick A and B, compare field by field, merge with a reason, undo from the history. */
export function AdminMergePage() {
  const adminText = useText(ADMIN_MESSAGES);
  const T = useText(ADMIN_MERGE_MESSAGES);
  const [selection, setSelection] = useState(emptyMergeSelection);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const ready = isMergeReady(selection);
  const preview = mergePreviewQuery.useQuery({ body: { survivorId: selection.survivor?.id ?? '', mergedId: selection.merged?.id ?? '' } }, { enabled: ready });
  const merge = mergeEntities.useMutation();
  const update = (next: typeof selection) => {
    setSelection(next);
    setDone(null);
  };
  return (
    <PageLayout
      title={T.title}
      eyebrow={adminText.eyebrow}
      lead={T.lead}
      breadcrumb={[{ label: adminText.eyebrow, link: { to: '/admin' } }, { label: T.title }]}
    >
      {/* biome-ignore lint/a11y/useValidAriaRole: `role` is the user role required by RequireSession, not an ARIA role. */}
      <RequireSession role="admin">
        <div className="admin-shell">
          <AdminNav />
          <div className="stack admin-main">
            {done && (
              <Notice tone="success" live="polite">
                {done}
              </Notice>
            )}
            <section className="stack" aria-labelledby="merge-pick-title">
              <div className="merge-toolbar">
                <h2 id="merge-pick-title">{T.pickTitle}</h2>
                <Button size="sm" variant="secondary" disabled={!selection.survivor && !selection.merged} onClick={() => update(swapMergeSides(selection))}>
                  {T.swap}
                </Button>
              </div>
              <div className="merge-pickers">
                <MergePicker
                  title={T.survivorTitle}
                  searchLabel={T.searchSurvivor}
                  value={selection.survivor}
                  onPick={(c) => update(pickMergeSide(selection, 'survivor', c))}
                />
                <MergePicker
                  title={T.mergedTitle}
                  searchLabel={T.searchMerged}
                  value={selection.merged}
                  onPick={(c) => update(pickMergeSide(selection, 'merged', c))}
                />
              </div>
            </section>
            {ready && (
              <section className="stack" aria-labelledby="merge-compare-title">
                <h2 id="merge-compare-title">{T.compareTitle}</h2>
                <QueryBoundary query={preview} loading={<SkeletonList rows={6} />}>
                  {(data) => (
                    <>
                      <MergeCompare
                        preview={data}
                        winnerOf={(field) => mergeWinnerOf(selection, field)}
                        onChoose={(field, winner) => update(chooseMergeField(selection, field, winner))}
                      />
                      <div>
                        <Button variant="primary" onClick={() => setConfirming(true)}>
                          {T.mergeButton}
                        </Button>
                      </div>
                    </>
                  )}
                </QueryBoundary>
                <ConfirmDialog
                  open={confirming}
                  onClose={() => setConfirming(false)}
                  title={T.confirmTitle(selection.merged.name, selection.survivor.name)}
                  confirmLabel={T.mergeButton}
                  confirmVariant="danger"
                  reason={{ ...ADMIN_REASON, label: T.reasonLabel }}
                  onConfirm={async (reason) => {
                    await merge.mutateAsync({ body: mergeRequestOf(selection, reason) });
                    setDone(T.mergedNotice(selection.merged.name, selection.survivor.name));
                    setSelection(emptyMergeSelection());
                  }}
                >
                  <p>{T.confirmText}</p>
                </ConfirmDialog>
              </section>
            )}
            <section className="stack" aria-labelledby="merge-history-title">
              <h2 id="merge-history-title">{T.historyTitle}</h2>
              <MergeHistory />
            </section>
          </div>
        </div>
      </RequireSession>
    </PageLayout>
  );
}
