import { AdminLayout } from './admin-layout.component';
import { DossierQueue } from './dossier-queue.component';
import { useQueueState } from './use-queue-state.hook';

/** A6 Dossiês "Mudou o jogo": same queue as the A1 tab. */
export function AdminDossiersPage() {
  return (
    <AdminLayout section="dossiers">
      <DossierQueue state={useQueueState()} />
    </AdminLayout>
  );
}
