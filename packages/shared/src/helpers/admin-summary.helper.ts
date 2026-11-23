import type { AdminSection } from '../enums/admin-section.enum';
import { ContactStatus } from '../enums/contact-status.enum';
import { DossierStatus } from '../enums/dossier-status.enum';
import { IngestionRunStatus } from '../enums/ingestion-run-status.enum';
import { PrivacyRequestStatus } from '../enums/privacy-request-status.enum';
import { ReviewStatus } from '../enums/review-status.enum';
import { SourceUsageStatus } from '../enums/source-usage-status.enum';
import { SuggestionStatus } from '../enums/suggestion-status.enum';
import type { AdminCommentsResponse, AdminInboxResponse, AdminIngestionResponse, CrawlerProposal } from '../types/admin.type';
import type { AdminDossier, AdminSourcesResponse, PrivacyRequest, TierSignal } from '../types/admin-curation.type';
import { isCommentFlagged } from './admin-rules.helper';

export interface AdminQueues {
  proposals: readonly Pick<CrawlerProposal, 'status'>[];
  signals: readonly Pick<TierSignal, 'isSignal'>[];
  runs: readonly Pick<AdminIngestionResponse['runs'][number], 'status'>[];
  sources: Pick<AdminSourcesResponse, 'sources' | 'queuedLinks'>;
  comments: AdminCommentsResponse['items'];
  inbox: AdminInboxResponse;
  dossiers: readonly Pick<AdminDossier, 'status'>[];
  privacy: readonly Pick<PrivacyRequest, 'status'>[];
}

/** Painel: what is waiting in each admin section (navigation badges). One rule for server and fixtures. */
export const adminPendingCounts = (q: AdminQueues): Record<AdminSection, number> => ({
  review: q.proposals.filter((p) => p.status === ReviewStatus.Pending).length + q.signals.filter((s) => s.isSignal).length,
  ingestion: q.runs.filter((r) => r.status === IngestionRunStatus.Failed || r.status === IngestionRunStatus.Partial).length,
  sources: q.sources.sources.filter((s) => s.usageStatus === SourceUsageStatus.PendingPermission).length + q.sources.queuedLinks.length,
  users: 0,
  comments: q.comments.filter(isCommentFlagged).length,
  contact:
    q.inbox.suggestions.filter((s) => s.status === SuggestionStatus.Pending).length + q.inbox.messages.filter((m) => m.status === ContactStatus.New).length,
  dossiers: q.dossiers.filter((d) => d.status === DossierStatus.Pending).length,
  privacy: q.privacy.filter((r) => r.status === PrivacyRequestStatus.Open || r.status === PrivacyRequestStatus.InProgress).length,
});
