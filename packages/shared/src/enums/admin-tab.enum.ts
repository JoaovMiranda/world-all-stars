/** Tabs of the admin pages (kept in the URL as `?tab=`). */
export const AdminReviewTab = { Proposals: 'proposals', Identities: 'identities', Rankings: 'rankings', Dossiers: 'dossiers', Tiers: 'tiers' } as const;
export type AdminReviewTab = (typeof AdminReviewTab)[keyof typeof AdminReviewTab];
export const ADMIN_REVIEW_TAB_VALUES = Object.values(AdminReviewTab) as [AdminReviewTab, ...AdminReviewTab[]];

export const AdminIngestionTab = { Runs: 'runs', Queue: 'queue' } as const;
export type AdminIngestionTab = (typeof AdminIngestionTab)[keyof typeof AdminIngestionTab];
export const ADMIN_INGESTION_TAB_VALUES = Object.values(AdminIngestionTab) as [AdminIngestionTab, ...AdminIngestionTab[]];

export const AdminUsersTab = { Users: 'users', Audit: 'audit' } as const;
export type AdminUsersTab = (typeof AdminUsersTab)[keyof typeof AdminUsersTab];
export const ADMIN_USERS_TAB_VALUES = Object.values(AdminUsersTab) as [AdminUsersTab, ...AdminUsersTab[]];

export const AdminCommentsTab = { Queue: 'queue', Words: 'words' } as const;
export type AdminCommentsTab = (typeof AdminCommentsTab)[keyof typeof AdminCommentsTab];
export const ADMIN_COMMENTS_TAB_VALUES = Object.values(AdminCommentsTab) as [AdminCommentsTab, ...AdminCommentsTab[]];

export const AdminContactTab = { Suggestions: 'suggestions', Messages: 'messages' } as const;
export type AdminContactTab = (typeof AdminContactTab)[keyof typeof AdminContactTab];
export const ADMIN_CONTACT_TAB_VALUES = Object.values(AdminContactTab) as [AdminContactTab, ...AdminContactTab[]];

export const AdminSourcesTab = { Registry: 'registry', Collection: 'collection' } as const;
export type AdminSourcesTab = (typeof AdminSourcesTab)[keyof typeof AdminSourcesTab];
export const ADMIN_SOURCES_TAB_VALUES = Object.values(AdminSourcesTab) as [AdminSourcesTab, ...AdminSourcesTab[]];
