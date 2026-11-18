import { type BaseRepository, type Database, SYSTEM_ACTOR, authAccounts, authSessions, authVerifications, users } from '@was/db';
import { AUTH_BASE_PATH, AUTH_COOKIE_PREFIX, AuthAuditAction, LOCALE_COOKIE, resolveLocale, uuidv7 } from '@was/shared';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';

import type { ServerConfig } from '../config/env.config';
import { hashIp } from '../middlewares/session.middleware';
import { promoteAdminEmails } from './admin-bootstrap.helper';

/** Path where Better Auth is mounted (app.ts): Google callback = `${BETTER_AUTH_URL}/api/auth/callback/google`. */
export { AUTH_BASE_PATH };

interface HookContext {
  headers?: Headers | undefined;
  request?: Request | undefined;
}
const headersOf = (ctx: HookContext | null): Headers | undefined => ctx?.headers ?? ctx?.request?.headers;
const cookieOf = (headers: Headers | undefined, name: string): string | undefined =>
  headers
    ?.get('cookie')
    ?.split(';')
    .map((p) => p.trim().split('='))
    .find(([k]) => k === name)?.[1];
const clientIp = (headers: Headers | undefined): string => headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || headers?.get('x-real-ip') || 'unknown';

/**
 * Better Auth (doc 04), Google only: the drizzle adapter writes `users` (name→displayName, image→avatarUrl) and the
 * ephemeral auth_* tables; ids are uuid v7; cookies `was.*` (HttpOnly, Lax, Secure in production). Database hooks:
 * new account → locale from the `was_locale` cookie, emailVerifiedAt, ADMIN_EMAILS role, audit; session → ip kept
 * only as the salted ip_hash + sign-in audit. E-mail/password and self-service deleteUser are off (E6 deletes).
 */
export const createBetterAuth = (db: Database, repo: BaseRepository, config: ServerConfig) => {
  const google = config.google;
  return betterAuth({
    appName: 'World All Stars',
    baseURL: config.betterAuthUrl,
    basePath: AUTH_BASE_PATH,
    secret: config.betterAuthSecret,
    trustedOrigins: [...new Set([config.betterAuthUrl, config.publicUrl, ...config.corsOrigins])],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { users, auth_sessions: authSessions, auth_accounts: authAccounts, auth_verifications: authVerifications },
    }),
    user: {
      modelName: 'users',
      fields: { name: 'displayName', image: 'avatarUrl' },
      deleteUser: { enabled: false },
    },
    // 30 days, renewed once a day while in use (cookie policy: "até sair ou 30 dias").
    session: { modelName: 'auth_sessions', expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    account: { modelName: 'auth_accounts', encryptOAuthTokens: true },
    verification: { modelName: 'auth_verifications' },
    emailAndPassword: { enabled: false },
    socialProviders: google ? { google: { clientId: google.clientId, clientSecret: google.clientSecret, prompt: 'select_account' } } : {},
    advanced: {
      cookiePrefix: AUTH_COOKIE_PREFIX,
      useSecureCookies: config.production,
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure: config.production },
      database: { generateId: () => uuidv7() },
    },
    telemetry: { enabled: false },
    databaseHooks: {
      user: {
        create: {
          after: async (user, ctx) => {
            const headers = headersOf(ctx);
            const locale = resolveLocale({ cookie: cookieOf(headers, LOCALE_COOKIE), acceptLanguage: headers?.get('accept-language') });
            const actor = { ...SYSTEM_ACTOR, userId: user.id, name: user.name, via: 'user' };
            await repo.update(users, user.id, { locale, emailVerifiedAt: user.emailVerified ? new Date() : null }, actor, { summary: 'signed up (Google)' });
            await repo.audit(actor, AuthAuditAction.SignedUp, { type: 'users', id: user.id }, { provider: 'google', actorName: user.name });
            await promoteAdminEmails(repo, config.adminEmails, user.id);
          },
        },
        update: {
          // emailVerified (Better Auth) → emailVerifiedAt (ours): set once when it turns true, cleared if it turns false.
          after: async (user) => {
            const [row] = await db.select({ at: users.emailVerifiedAt }).from(users).where(eq(users.id, user.id));
            if (!row || (user.emailVerified ? row.at !== null : row.at === null)) return;
            await repo.update(users, user.id, { emailVerifiedAt: user.emailVerified ? new Date() : null }, SYSTEM_ACTOR, { summary: 'e-mail verification synced' });
          },
        },
      },
      session: {
        create: {
          before: async (session, ctx) => ({ data: { ...session, ipAddress: hashIp(session.ipAddress || clientIp(headersOf(ctx)), config.ipHashSalt) } }),
          after: async (session) => {
            await repo.audit({ userId: session.userId, via: 'user', ipHash: session.ipAddress ?? null, userAgent: session.userAgent ?? null }, AuthAuditAction.SignedIn, { type: 'users', id: session.userId });
          },
        },
      },
    },
  });
};
export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
