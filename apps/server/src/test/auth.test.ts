// Google sign-in (Better Auth) on the server: provider rules (pending/reader/admin/banned/unverified), the consent
// contract, account deletion, ADMIN_EMAILS, the forbid_delete exemption of the auth tables and the config guard.
// No network and no plan/: Better Auth's getSession is stubbed by a header naming the user id.
import { createHmac } from 'node:crypto';

import { authAccounts, authSessions, createDatabase, type DatabaseHandle, legalAcceptances, SYSTEM_ACTOR, users } from '@was/db';
import { ACCOUNT_DELETE_CONFIRMATION, LEGAL_DOCUMENT_VERSIONS, LOCALE_HEADER, uuidv7 } from '@was/shared';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../app';
import { promoteAdminEmails } from '../auth/admin-bootstrap.helper';
import { loadConfig } from '../config/env.config';

const USER_HEADER = 'x-test-user';
const current = (kind: 'terms' | 'privacy') => LEGAL_DOCUMENT_VERSIONS[kind].version;

describe('Better Auth provider + consent', () => {
  let handle: DatabaseHandle;
  let created: ReturnType<typeof createApp>;
  const ids: Record<'pending' | 'reader' | 'admin' | 'banned' | 'unverified' | 'outdated', string> = {} as never;

  const call = async (method: string, path: string, user?: string, body?: unknown, headers: Record<string, string> = {}) => {
    const res = await created.app.request(path, {
      method,
      headers: { 'content-type': 'application/json', ...(user ? { [USER_HEADER]: user } : {}), ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, json: (await res.json().catch(() => null)) as any };
  };
  const accept = (userId: string, kind: 'terms' | 'privacy', version = current(kind)) =>
    created.deps.repo.insert(legalAcceptances, { userId, documentKind: kind, documentVersion: version, acceptedAt: new Date() }, SYSTEM_ACTOR);

  beforeAll(async () => {
    handle = await createDatabase({ pgliteDataDir: 'memory://' });
    await handle.migrate();
    const config = { ...loadConfig({}), authSimulated: false, logRequests: false, rateLimitEnabled: false };
    created = createApp({
      db: handle.db,
      config,
      // Stub of auth.api.getSession: the cookie lookup is Better Auth's job; the provider rules are ours.
      sessionLookup: { getSession: async ({ headers }) => (headers.get(USER_HEADER) ? { user: { id: headers.get(USER_HEADER)! } } : null) },
    });
    const add = async (key: keyof typeof ids, extra: Partial<typeof users.$inferInsert> = {}) => {
      const row = await created.deps.repo.insert(users, { email: `${key}@test.invalid`, displayName: `User ${key}`, emailVerified: true, ...extra }, SYSTEM_ACTOR);
      ids[key] = row.id;
    };
    await add('pending');
    await add('reader');
    await add('admin', { role: 'admin' });
    await add('banned', { bannedAt: new Date() });
    await add('unverified', { emailVerified: false });
    await add('outdated');
    for (const key of ['reader', 'admin', 'banned', 'unverified'] as const) {
      await accept(ids[key], 'terms');
      await accept(ids[key], 'privacy');
    }
    await accept(ids.outdated, 'terms');
    await accept(ids.outdated, 'privacy', '0.0-old');
  });
  afterAll(() => handle.close());

  it('anonymous without a session; Better Auth is mounted on /api/auth', async () => {
    expect((await call('GET', '/api/session')).json).toMatchObject({ kind: 'anon', user: null, pendingConsent: null, simulated: false, googleEnabled: false });
    expect((await call('GET', '/api/auth/ok')).status).toBe(200);
  });

  it('pending consent (never accepted, or an outdated Privacy version) counts as anonymous', async () => {
    for (const key of ['pending', 'outdated'] as const) {
      const session = await call('GET', '/api/session', ids[key]);
      expect(session.json).toMatchObject({ kind: 'anon', user: null, pendingConsent: { email: `${key}@test.invalid`, name: `User ${key}` } });
      expect((await call('GET', '/api/me', ids[key])).status).toBe(401);
    }
  });

  it('reader and admin by role; banned → 403 banned; unverified e-mail → 403 email_unverified (translated)', async () => {
    expect((await call('GET', '/api/session', ids.reader)).json).toMatchObject({ kind: 'reader', user: { email: 'reader@test.invalid' }, pendingConsent: null });
    expect((await call('GET', '/api/me', ids.reader)).status).toBe(200);
    expect((await call('GET', '/api/session', ids.admin)).json.kind).toBe('admin');
    expect((await call('GET', '/api/admin/summary', ids.admin)).status).toBe(200);
    expect((await call('GET', '/api/admin/summary', ids.reader)).status).toBe(403);
    const banned = await call('GET', '/api/me', ids.banned);
    expect([banned.status, banned.json.error]).toEqual([403, 'banned']);
    const unverified = await call('GET', '/api/me', ids.unverified, undefined, { [LOCALE_HEADER]: 'en' });
    expect([unverified.status, unverified.json.error]).toEqual([403, 'email_unverified']);
    expect(unverified.json.message).toMatch(/not been verified/);
  });

  it('POST /api/account/consent: 401 anonymous, 409 wrong version, then rows with ip_hash and the session becomes reader', async () => {
    const body = { termsVersion: current('terms'), privacyVersion: current('privacy'), adult: true };
    expect((await call('POST', '/api/account/consent', undefined, body)).status).toBe(401);
    const stale = await call('POST', '/api/account/consent', ids.pending, { ...body, privacyVersion: '0.0-old' });
    expect([stale.status, stale.json.error]).toEqual([409, 'consent_outdated']);
    expect((await call('POST', '/api/account/consent', ids.pending, { ...body, adult: false })).status).toBe(422);

    expect((await call('POST', '/api/account/consent', ids.pending, body)).json).toEqual({ ok: true });
    const rows = await handle.db.select().from(legalAcceptances).where(eq(legalAcceptances.userId, ids.pending));
    expect(rows.map((r) => `${r.documentKind}@${r.documentVersion}`).sort()).toEqual(
      [`age_declaration@${LEGAL_DOCUMENT_VERSIONS.age_declaration.version}`, `privacy@${current('privacy')}`, `terms@${current('terms')}`].sort(),
    );
    for (const r of rows) expect(r.ipHash).toMatch(/^[0-9a-f]{32}$/);
    expect((await call('GET', '/api/session', ids.pending)).json.kind).toBe('reader');
    // Already accepted: nothing pending any more.
    expect((await call('POST', '/api/account/consent', ids.pending, body)).status).toBe(409);
  });

  it('account deletion removes the Better Auth sessions and accounts (physical DELETE allowed there)', async () => {
    const now = new Date();
    await handle.db.insert(authSessions).values({ id: uuidv7(), userId: ids.reader, token: `t-${uuidv7()}`, expiresAt: new Date(now.getTime() + 86_400_000) });
    await handle.db.insert(authAccounts).values({ id: uuidv7(), userId: ids.reader, accountId: 'google-sub-1', providerId: 'google' });
    const res = await call('DELETE', '/api/me', ids.reader, { confirmation: ACCOUNT_DELETE_CONFIRMATION });
    expect(res.status).toBe(200);
    expect(await handle.db.select().from(authSessions).where(eq(authSessions.userId, ids.reader))).toHaveLength(0);
    expect(await handle.db.select().from(authAccounts).where(eq(authAccounts.userId, ids.reader))).toHaveLength(0);
    expect((await call('GET', '/api/session', ids.reader)).json.kind).toBe('anon'); // soft-deleted account
  });

  it('ADMIN_EMAILS promotes once (idempotent) and audits role_changed', async () => {
    expect(await promoteAdminEmails(created.deps.repo, ['outdated@test.invalid'])).toBe(1);
    expect(await promoteAdminEmails(created.deps.repo, ['outdated@test.invalid'])).toBe(0);
    const [row] = await handle.db.select({ role: users.role }).from(users).where(eq(users.id, ids.outdated));
    expect(row?.role).toBe('admin');
    const audit = await handle.db.execute(sql`select count(*)::int as n from audit_logs where action = 'role_changed' and entity_id = ${ids.outdated}`);
    expect((audit as unknown as { rows: { n: number }[] }).rows[0]?.n).toBe(1);
  });
});

describe('real Better Auth (drizzle adapter on users + auth_* tables, signed cookie)', () => {
  it('creates a Google user + session, resolves the cookie as pending, and signs out (session row deleted)', async () => {
    const handle = await createDatabase({ pgliteDataDir: 'memory://' });
    await handle.migrate();
    const config = { ...loadConfig({}), authSimulated: false, logRequests: false, rateLimitEnabled: false, adminEmails: ['ana@test.invalid'] };
    const { app, betterAuth } = createApp({ db: handle.db, config });
    const ctx = await betterAuth.$context;
    const created = await ctx.internalAdapter.createOAuthUser(
      { email: 'ana@test.invalid', name: 'Ana Google', image: 'https://lh3.googleusercontent.com/a/x', emailVerified: true },
      { providerId: 'google', accountId: 'google-sub-ana' },
    );
    const [row] = await handle.db.select().from(users).where(eq(users.id, created.user.id));
    // name→displayName, image→avatarUrl, uuid v7 id, emailVerified mirrored in emailVerifiedAt, ADMIN_EMAILS role.
    expect(row).toMatchObject({ displayName: 'Ana Google', avatarUrl: 'https://lh3.googleusercontent.com/a/x', emailVerified: true, role: 'admin' });
    expect(row?.emailVerifiedAt).toBeInstanceOf(Date);
    expect(row?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7/);

    const session = await ctx.internalAdapter.createSession(created.user.id);
    const [stored] = await handle.db.select().from(authSessions).where(eq(authSessions.token, session.token));
    expect(stored?.ipAddress).toMatch(/^[0-9a-f]{32}$/); // only the ip_hash is kept
    const signature = createHmac('sha256', config.betterAuthSecret).update(session.token).digest('base64');
    const cookie = `was.session_token=${encodeURIComponent(`${session.token}.${signature}`)}`;

    const res = await app.request('/api/session', { headers: { cookie } });
    expect(await res.json()).toMatchObject({ kind: 'anon', pendingConsent: { email: 'ana@test.invalid', name: 'Ana Google' } });

    const out = await app.request('/api/auth/sign-out', { method: 'POST', headers: { cookie, origin: config.betterAuthUrl, 'content-type': 'application/json' }, body: '{}' });
    expect(out.status).toBe(200);
    expect(await handle.db.select().from(authSessions)).toHaveLength(0);
    await handle.close();
  });
});

describe('Google sign-in start (no network: only the authorization URL is built)', () => {
  it('redirects to Google with the localhost callback, select_account and the openid/email/profile scopes', async () => {
    const handle = await createDatabase({ pgliteDataDir: 'memory://' });
    await handle.migrate();
    const config = { ...loadConfig({ GOOGLE_CLIENT_ID: 'test-client.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'test-secret' }), logRequests: false };
    const { app } = createApp({ db: handle.db, config });
    const res = await app.request('/api/auth/sign-in/social', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:8787' },
      body: JSON.stringify({ provider: 'google', callbackURL: 'http://localhost:8787/athletes/pele' }),
    });
    expect(res.status).toBe(200);
    const url = new URL(((await res.json()) as { url: string }).url);
    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:8787/api/auth/callback/google');
    expect(url.searchParams.get('prompt')).toBe('select_account');
    expect(url.searchParams.get('scope')?.split(' ').sort()).toEqual(['email', 'openid', 'profile']);
    expect(res.headers.get('set-cookie')).toMatch(/was\.state=/);
    await handle.close();
  });
});

describe('migration 0002_auth (forbid_delete exemption)', () => {
  it('allows DELETE on auth_sessions and still blocks it on users', async () => {
    const handle = await createDatabase({ pgliteDataDir: 'memory://' });
    await handle.migrate();
    const [user] = await handle.db.insert(users).values({ email: 'del@test.invalid', displayName: 'Del' }).returning();
    await handle.db.insert(authSessions).values({ id: uuidv7(), userId: user!.id, token: 'tok', expiresAt: new Date(Date.now() + 1000) });
    await handle.db.delete(authSessions).where(eq(authSessions.token, 'tok'));
    expect(await handle.db.select().from(authSessions)).toHaveLength(0);
    await expect(handle.db.delete(users).where(eq(users.id, user!.id))).rejects.toThrow();
    await handle.close();
  });
});

/** Dummy production secrets (tests only). */
const PROD_SECRETS = { BETTER_AUTH_SECRET: 'test-better-auth-secret-0123456789abcdef', IP_HASH_SALT: 'test-ip-hash-salt-0123' };

describe('auth config', () => {
  it('AUTH_SIMULATED in production refuses to boot; simulated defaults on in dev, off in production', () => {
    expect(() => loadConfig({ ...PROD_SECRETS, NODE_ENV: 'production', AUTH_SIMULATED: '1' })).toThrow(/AUTH_SIMULATED/);
    expect(loadConfig({ ...PROD_SECRETS, NODE_ENV: 'production' }).authSimulated).toBe(false);
    expect(loadConfig({}).authSimulated).toBe(true);
    expect(loadConfig({ AUTH_SIMULATED: '0' }).authSimulated).toBe(false);
  });

  it('production requires BETTER_AUTH_SECRET and a real IP_HASH_SALT (even without Google); dev has defaults', () => {
    const prod = { ...PROD_SECRETS, NODE_ENV: 'production' };
    expect(() => loadConfig({ ...prod, BETTER_AUTH_SECRET: undefined })).toThrow(/BETTER_AUTH_SECRET is required/);
    expect(() => loadConfig({ ...prod, BETTER_AUTH_SECRET: '' })).toThrow(/BETTER_AUTH_SECRET is required/);
    expect(() => loadConfig({ ...prod, BETTER_AUTH_SECRET: 'short' })).toThrow(/32 characters/);
    expect(() => loadConfig({ ...prod, IP_HASH_SALT: undefined })).toThrow(/IP_HASH_SALT is required/);
    expect(() => loadConfig({ ...prod, IP_HASH_SALT: 'short' })).toThrow(/IP_HASH_SALT is required/);
    expect(() => loadConfig({ ...prod, IP_HASH_SALT: 'dev-only-salt' })).toThrow(/IP_HASH_SALT is required/);
    const config = loadConfig(prod);
    expect(config.betterAuthSecret).toBe(PROD_SECRETS.BETTER_AUTH_SECRET);
    expect(config.ipHashSalt).toBe(PROD_SECRETS.IP_HASH_SALT);
    expect(loadConfig({}).ipHashSalt).toBe('dev-only-salt');
  });

  it('Google needs both credentials; empty .env values mean unset; ADMIN_EMAILS is normalized', () => {
    expect(loadConfig({ GOOGLE_CLIENT_ID: 'id' }).google).toBeNull();
    expect(loadConfig({ GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 's' }).google).toEqual({ clientId: 'id', clientSecret: 's' });
    expect(loadConfig({ BETTER_AUTH_SECRET: '', BETTER_AUTH_URL: '', AUTH_SIMULATED: '' }).betterAuthUrl).toBe('http://localhost:8787');
    expect(loadConfig({ ADMIN_EMAILS: ' A@x.com, b@y.com ,' }).adminEmails).toEqual(['a@x.com', 'b@y.com']);
  });
});
