import { ADMIN_REVIEW_TAB_VALUES, AdminReviewSearchSchema, AdminReviewTab } from '@was/shared';

import { Tabs } from '@/shared-ui/tabs.component';

import { ADMIN_TEXT } from './admin.const';
import { AdminLayout } from './admin-layout.component';
import { DossierQueue } from './dossier-queue.component';
import { ProposalQueue } from './proposal-queue.component';
import { TierSignals } from './tier-signals.component';
import { useAdminTab } from './use-admin-tab.hook';
import { useQueueState } from './use-queue-state.hook';

const T = ADMIN_TEXT.review;

/** A1 Revisão da coleta: proposals (3-way diff + evidence) · dossiers · tier signals. */
export function AdminReviewPage() {
  const { tab, setTab } = useAdminTab(AdminReviewSearchSchema, ADMIN_REVIEW_TAB_VALUES);
  const state = useQueueState();
  return (
    <AdminLayout section="review">
      <Tabs
        label={T.tabsLabel}
        value={tab}
        onChange={setTab}
        tabs={[
          { value: AdminReviewTab.Proposals, label: T.tabs.proposals },
          { value: AdminReviewTab.Dossiers, label: T.tabs.dossiers },
          { value: AdminReviewTab.Tiers, label: T.tabs.tiers },
        ]}
      >
        {tab === AdminReviewTab.Proposals && <ProposalQueue state={state} />}
        {tab === AdminReviewTab.Dossiers && <DossierQueue state={state} />}
        {tab === AdminReviewTab.Tiers && <TierSignals state={state} />}
      </Tabs>
    </AdminLayout>
  );
}
