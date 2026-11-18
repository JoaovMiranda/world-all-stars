import { type BaseRepository, SYSTEM_ACTOR, active, users } from '@was/db';
import { AdminAuditAction, UserRole } from '@was/shared';
import { and, eq, inArray, ne } from 'drizzle-orm';

/** Reason recorded in the audit log when ADMIN_EMAILS promotes an account. */
export const ADMIN_EMAILS_REASON = 'ADMIN_EMAILS';

/**
 * Promotes the live accounts whose e-mail is in ADMIN_EMAILS to admin (idempotent: already-admins are skipped).
 * Runs on boot and right after a Google sign-up. Each promotion is versioned + audited as role_changed.
 */
export const promoteAdminEmails = async (repo: BaseRepository, adminEmails: readonly string[], onlyUserId?: string): Promise<number> => {
  if (!adminEmails.length) return 0;
  const rows = await repo.db
    .select({ id: users.id, name: users.displayName })
    .from(users)
    .where(active(users, and(inArray(users.email, [...adminEmails]), ne(users.role, UserRole.Admin), onlyUserId ? eq(users.id, onlyUserId) : undefined)));
  for (const u of rows) {
    await repo.transaction(async (tx) => {
      await tx.update(users, u.id, { role: UserRole.Admin }, SYSTEM_ACTOR, { reason: ADMIN_EMAILS_REASON, summary: 'promoted by ADMIN_EMAILS' });
      await tx.audit(SYSTEM_ACTOR, AdminAuditAction.RoleChanged, { type: 'users', id: u.id }, { target: u.name, reason: ADMIN_EMAILS_REASON, actorName: 'system' });
    });
  }
  return rows.length;
};
