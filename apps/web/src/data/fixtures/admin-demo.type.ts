import type {
  AdminAuditEntry,
  AdminIngestionRun,
  AdminQueuedLink,
  BannedWord,
  ContactStatus,
  DossierStatus,
  PrivacyRequestStatus,
  ReviewStatus,
  SourceUsageStatus,
  UserRole,
} from '@was/shared';

/** Admin decisions taken in the demo (fixture mode), overlaid on the sample data by admin.fixture.ts. */
export interface AdminDemoState {
  proposals: Record<string, { status: ReviewStatus; reason: string }>;
  dossiers: Record<string, { approvedBy: string[]; status: DossierStatus; reason: string }>;
  sources: Record<string, { usageStatus?: SourceUsageStatus; licenseReviewedAt?: string | null }>;
  queuedLinks: AdminQueuedLink[];
  users: Record<string, { role?: UserRole; bannedAt?: string | null; banReason?: string | null }>;
  privacy: Record<string, { status: PrivacyRequestStatus; note: string; at: string; by: string }>;
  messages: Record<string, ContactStatus>;
  bannedWordsAdded: BannedWord[];
  /** `${locale}:${term}` of removed sample words. */
  bannedWordsRemoved: string[];
  runs: AdminIngestionRun[];
  audit: AdminAuditEntry[];
}

export const initialAdminDemo = (): AdminDemoState => ({
  proposals: {},
  dossiers: {},
  sources: {},
  queuedLinks: [],
  users: {},
  privacy: {},
  messages: {},
  bannedWordsAdded: [],
  bannedWordsRemoved: [],
  runs: [],
  audit: [],
});
