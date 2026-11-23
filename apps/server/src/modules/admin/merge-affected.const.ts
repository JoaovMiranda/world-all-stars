import { AdminAuditAction } from '@was/shared';
import { athletes, competitors, fieldProvenance, slugRedirects } from '@was/db';

/**
 * Key prefixes of `entity_merges.affected` besides the plain `table.column` lists of re-pointed ids: everything the
 * merge did, so unmerge can undo it exactly.
 */
export const MERGE_AFFECTED_PREFIX = {
  /** `__kept:table.column` → rows that could not move (unique conflict with a survivor row); they stay untouched. */
  kept: '__kept:',
  /** `__restore:table` → `id@version` of the entity rows to restore to that version (entity_versions snapshot). */
  restore: '__restore:',
  /** `__created:table` → rows the merge inserted (redirect, manual provenance); soft-deleted by unmerge. */
  created: '__created:',
} as const;

/** Audit actions of merges (admin decisions, with the reason in the metadata). */
export const MERGE_AUDIT_ACTION = { merged: AdminAuditAction.EntityMerged, unmerged: AdminAuditAction.EntityUnmerged } as const;

/** Tables whose rows a merge may create (listed under `__created:`), by SQL name. */
export const MERGE_CREATED_TABLES = { field_provenance: fieldProvenance, slug_redirects: slugRedirects } as const;

/** Entity tables a merge snapshots and may restore (listed under `__restore:`), by SQL name. */
export const MERGE_RESTORE_TABLES = { athletes, competitors } as const;
