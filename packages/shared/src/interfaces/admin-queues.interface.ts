import type { AdminCommentsResponse, AdminInboxResponse, AdminIngestionResponse, CrawlerProposal } from '../types/admin.type';
import type { AdminDossier, AdminSourcesResponse, PrivacyRequest, TierSignal } from '../types/admin-curation.type';
import type { TierVoteFlag } from '../types/tier-vote-flag.type';

export interface AdminQueues {
  proposals: readonly Pick<CrawlerProposal, 'status'>[];
  signals: readonly Pick<TierSignal, 'isSignal'>[];
  /** Accounts flagged by the tier-vote anomaly rule (T3.2); pending ones wait for review. */
  tierVoteFlags?: readonly Pick<TierVoteFlag, 'status'>[] | undefined;
  runs: readonly Pick<AdminIngestionResponse['runs'][number], 'status'>[];
  sources: Pick<AdminSourcesResponse, 'sources' | 'queuedLinks'>;
  comments: AdminCommentsResponse['items'];
  inbox: AdminInboxResponse;
  dossiers: readonly Pick<AdminDossier, 'status'>[];
  privacy: readonly Pick<PrivacyRequest, 'status'>[];
}
