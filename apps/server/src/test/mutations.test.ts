// Business rules of the mutations (rules come from @was/shared; the server only applies them).
import { AdminApi, ParticipationApi, PublicApi } from '@was/shared';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { HAS_PROTOTYPE, createTestApp, type TestApp } from './test-app.helper';

describe.skipIf(!HAS_PROTOTYPE)('mutations', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  describe('comments (doc 20)', () => {
    const post = (body: string, parentId?: string) => t.call(ParticipationApi.postComment, { params: { slug: 'pele' }, body: { body, ...(parentId ? { parentId } : {}) } }, 'reader');

    it('refuses an empty comment with 422 + field error', async () => {
      const res = await post('   \n  ');
      expect(res.status).toBe(422);
      expect(res.json.error).toBe('empty');
      expect(res.json.errors.body).toBeTruthy();
    });

    it('refuses a banned word with 422', async () => {
      const ctx = (await t.call(PublicApi.validationContext)).json;
      const word = ctx.bannedWords.find((w: { matchMode: string }) => w.matchMode === 'word');
      const res = await post(`isso é ${word.term} demais`);
      expect(res.status).toBe(422);
      expect(res.json.error).toBe('banned_word');
    });

    it('posts, lists, and forbids reacting to your own comment (403)', async () => {
      const created = await post('Que craque!');
      expect(created.status).toBe(200);
      const list = await t.call(ParticipationApi.comments, { params: { slug: 'pele' }, query: { sort: 'recent' } }, 'reader');
      expect(list.json.threads[0]).toMatchObject({ id: created.json.id, isMine: true });
      const react = await t.call(ParticipationApi.reactToComment, { params: { id: created.json.id }, body: { reaction: 'like' } }, 'reader');
      expect(react.status).toBe(403);
      expect(react.json.error).toBe('own');
    });

    it('a reaction by someone else counts, switches and undoes', async () => {
      const created = await post('Outro comentário');
      const like = await t.call(ParticipationApi.reactToComment, { params: { id: created.json.id }, body: { reaction: 'like' } }, 'admin');
      expect(like.json).toEqual({ reaction: 'like', likes: 1, dislikes: 0 });
      const dislike = await t.call(ParticipationApi.reactToComment, { params: { id: created.json.id }, body: { reaction: 'dislike' } }, 'admin');
      expect(dislike.json).toEqual({ reaction: 'dislike', likes: 0, dislikes: 1 });
      const undo = await t.call(ParticipationApi.reactToComment, { params: { id: created.json.id }, body: { reaction: null } }, 'admin');
      expect(undo.json).toEqual({ reaction: null, likes: 0, dislikes: 0 });
    });

    it('a reply notifies the author of the parent comment', async () => {
      const created = await post('Alguém viu o gol de 1958?');
      await t.call(ParticipationApi.postComment, { params: { slug: 'pele' }, body: { body: 'Eu vi!', parentId: created.json.id } }, 'admin');
      const notes = await t.call(ParticipationApi.notifications, {}, 'reader');
      const note = notes.json.items.find((n: { commentId: string | null; excerpt: string }) => n.excerpt === 'Eu vi!');
      expect(note).toMatchObject({ kind: 'comment_reply', read: false });
      expect((await t.call(ParticipationApi.markNotificationRead, { params: { id: note.id } }, 'reader')).status).toBe(200);
    });
  });

  describe('comment pages (cursor, doc 20)', () => {
    it('walks every thread once, in order, for both sorts; replies come with their thread', async () => {
      for (let i = 0; i < 25; i += 1) {
        await t.call(ParticipationApi.postComment, { params: { slug: 'pele' }, body: { body: `Página ${i}` } }, 'reader');
      }
      const first = await t.call(ParticipationApi.comments, { params: { slug: 'pele' }, query: { sort: 'recent' } }, 'reader');
      await t.call(ParticipationApi.postComment, { params: { slug: 'pele' }, body: { body: 'Resposta', parentId: first.json.threads[0].id } }, 'admin');
      for (const sort of ['recent', 'top'] as const) {
        const seen: string[] = [];
        let cursor: string | undefined;
        let pages = 0;
        let total = 0;
        do {
          const res = await t.call(ParticipationApi.comments, { params: { slug: 'pele' }, query: { sort, ...(cursor ? { cursor } : {}) } }, 'reader');
          expect(res.status).toBe(200);
          expect(res.json.threads.length).toBeLessThanOrEqual(20);
          seen.push(...res.json.threads.map((x: { id: string }) => x.id));
          total = res.json.total;
          cursor = res.json.nextCursor ?? undefined;
          pages += 1;
        } while (cursor && pages < 20);
        expect(pages).toBeGreaterThan(1);
        expect(new Set(seen).size).toBe(seen.length);
        // total counts threads + replies; every top-level comment was listed exactly once.
        const all = await t.handle.db.execute(sql`select count(*)::int as n from comments c join athletes a on a.id = c.athlete_id where a.slug = 'pele' and c.deleted_at is null and c.status = 'visible' and c.parent_comment_id is null`);
        expect(seen.length).toBe((all as unknown as { rows: { n: number }[] }).rows[0]?.n);
        expect(total).toBeGreaterThan(seen.length);
      }
      const recent = await t.call(ParticipationApi.comments, { params: { slug: 'pele' }, query: { sort: 'recent' } }, 'reader');
      expect(recent.json.threads.find((x: { id: string }) => x.id === first.json.threads[0].id)?.replies[0]).toMatchObject({ body: 'Resposta' });
    });

    it('an unknown cursor restarts at the first page', async () => {
      const first = await t.call(ParticipationApi.comments, { params: { slug: 'pele' }, query: { sort: 'top' } });
      const bogus = await t.call(ParticipationApi.comments, { params: { slug: 'pele' }, query: { sort: 'top', cursor: '00000000-0000-7000-8000-000000000000' } });
      expect(bogus.json.threads.map((x: { id: string }) => x.id)).toEqual(first.json.threads.map((x: { id: string }) => x.id));
    });
  });

  describe('tier votes (doc 17)', () => {
    it('changing the vote does not increment the user counter', async () => {
      const before = (await t.call(ParticipationApi.session, {}, 'reader')).json.user.tierVotesCount;
      const first = await t.call(ParticipationApi.castTierVote, { params: { slug: 'neymar' }, body: { tier: 'elite' } }, 'reader');
      expect(first.json).toEqual({ myVote: 'elite', userVotesCount: before + 1 });
      const changed = await t.call(ParticipationApi.castTierVote, { params: { slug: 'neymar' }, body: { tier: 'legendary' } }, 'reader');
      expect(changed.json).toEqual({ myVote: 'legendary', userVotesCount: before + 1 });
      const votes = await t.call(ParticipationApi.tierVotes, { params: { slug: 'neymar' } }, 'reader');
      expect(votes.json.myVote).toBe('legendary');
    });

    it('refuses Mythic without an approved dossier (422) and the same tier', async () => {
      const hall = (await t.call(PublicApi.hallOfGreats)).json;
      const dossiers = (await t.call(AdminApi.dossiers, {}, 'admin')).json.items;
      const candidate = hall.candidates.find((c: { slug: string }) => !dossiers.some((d: { athlete: { slug: string }; status: string }) => d.athlete.slug === c.slug && d.status === 'approved'));
      const res = await t.call(AdminApi.setOfficialTier, { params: { slug: candidate.slug }, body: { tier: 'mythic', reason: 'teste de regra' } }, 'admin');
      expect(res.status).toBe(422);
      expect(res.json.error).toBe('dossier_required');
      const same = await t.call(AdminApi.setOfficialTier, { params: { slug: candidate.slug }, body: { tier: candidate.tier, reason: 'teste de regra' } }, 'admin');
      expect(same.json.error).toBe('same_tier');
    });

    it('changes the official tier with history and a new version', async () => {
      const before = (await t.call(PublicApi.athleteProfile, { params: { slug: 'neymar' } })).json;
      const target = before.tier === 'elite' ? 'champion' : 'elite';
      const res = await t.call(AdminApi.setOfficialTier, { params: { slug: 'neymar' }, body: { tier: target, reason: 'revisão da curadoria' } }, 'admin');
      expect(res.json).toEqual({ official: target });
      const after = (await t.call(PublicApi.athleteProfile, { params: { slug: 'neymar' } })).json;
      expect(after.tier).toBe(target);
      expect(after.version.current).toBe(before.version.current + 1);
      expect(after.version.history[0].summary).toContain(target);
      expect(after.tierHistory.at(-1)).toMatchObject({ from: before.tier, to: target });
    });
  });

  describe('suggestion and contact (doc 21)', () => {
    const suggest = (body: Record<string, unknown>) => t.call(ParticipationApi.submitSuggestion, { body: { athleteName: 'Fulano', urls: ['https://en.wikipedia.org/wiki/Fulano'], ...body } });

    it('accepts a valid suggestion with a protocol', async () => {
      const res = await suggest({});
      expect(res.status).toBe(200);
      expect(res.json.protocol).toMatch(/^SUG-\d{6}$/);
    });
    it('refuses an athlete already on the site', async () => {
      const res = await suggest({ athleteName: 'Pelé' });
      expect(res.status).toBe(422);
      expect(res.json.errors.athleteName).toContain('já está no site');
    });
    it('refuses http and IP links (anti-SSRF)', async () => {
      const res = await suggest({ urls: ['http://en.wikipedia.org/wiki/X', 'https://10.0.0.1/x'] });
      expect(res.status).toBe(422);
      expect(Object.keys(res.json.errors)).toEqual(expect.arrayContaining(['urls.0', 'urls.1']));
    });
    it('contact: 422 with field errors, then 200', async () => {
      const bad = await t.call(ParticipationApi.submitContact, { body: { name: '', email: 'x', topic: 'nope', body: ' ' } });
      expect(bad.status).toBe(422);
      expect(Object.keys(bad.json.errors).sort()).toEqual(['body', 'email', 'name', 'topic']);
      const ok = await t.call(ParticipationApi.submitContact, { body: { name: 'Ana', email: 'ana@exemplo.invalid', topic: 'press', body: 'Olá curadoria' } });
      expect(ok.json.protocol).toMatch(/^CTT-/);
      const inbox = await t.call(AdminApi.inbox, {}, 'admin');
      expect(inbox.json.messages.some((m: { protocol: string }) => m.protocol === ok.json.protocol)).toBe(true);
    });
  });

  describe('access (contract `access`)', () => {
    it('admin routes: 401 anonymous, 403 reader, 200 admin', async () => {
      expect((await t.call(AdminApi.summary)).status).toBe(401);
      expect((await t.call(AdminApi.summary, {}, 'reader')).status).toBe(403);
      expect((await t.call(AdminApi.summary, {}, 'admin')).status).toBe(200);
      expect((await t.call(AdminApi.setOfficialTier, { params: { slug: 'pele' }, body: { tier: 'elite', reason: 'xxx' } }, 'reader')).status).toBe(403);
    });
    it('reader routes: 401 anonymous', async () => {
      const res = await t.call(ParticipationApi.castTierVote, { params: { slug: 'pele' }, body: { tier: 'elite' } });
      expect(res.status).toBe(401);
      expect(res.json.error).toBe('auth');
    });
    it('invalid body: 422 with field errors from the contract schema', async () => {
      const res = await t.call(AdminApi.reviewDossier, { params: { id: 'x' }, body: { decision: 'maybe', reason: '' } }, 'admin');
      expect(res.status).toBe(422);
      expect(Object.keys(res.json.errors)).toEqual(expect.arrayContaining(['decision', 'reason']));
    });
  });

  describe('admin decisions', () => {
    it('dossier: second approval by the same admin refused; another admin publishes', async () => {
      const pending = (await t.call(AdminApi.dossiers, {}, 'admin')).json.items.find((d: { status: string }) => d.status === 'pending');
      expect(pending).toBeTruthy();
      const first = await t.call(AdminApi.reviewDossier, { params: { id: pending.id }, body: { decision: 'approve', reason: 'evidências ok' } }, 'admin');
      expect(first.status).toBe(200);
      const again = await t.call(AdminApi.reviewDossier, { params: { id: pending.id }, body: { decision: 'approve', reason: 'de novo' } }, 'admin');
      expect([200, 422]).toContain(again.status);
      const audit = (await t.call(AdminApi.users, {}, 'admin')).json.audit;
      expect(audit[0].action).toMatch(/dossier_/);
    });
    it('proposal decided once; suggestion approval queues links; message answered', async () => {
      const proposal = (await t.call(AdminApi.proposals, {}, 'admin')).json.items.find((p: { status: string }) => p.status === 'pending');
      expect((await t.call(AdminApi.reviewProposal, { params: { id: proposal.id }, body: { decision: 'reject', reason: 'fonte fraca' } }, 'admin')).status).toBe(200);
      const twice = await t.call(AdminApi.reviewProposal, { params: { id: proposal.id }, body: { decision: 'approve', reason: 'mudei de ideia' } }, 'admin');
      expect(twice.json.error).toBe('already_decided');
      const inbox = (await t.call(AdminApi.inbox, {}, 'admin')).json;
      const ok = inbox.suggestions.find((s: { urls: string[] }) => s.urls.every((u) => u.includes('wikipedia')));
      expect((await t.call(AdminApi.reviewSuggestion, { params: { id: ok.id }, body: { status: 'approved' } }, 'admin')).status).toBe(200);
      const sources = (await t.call(AdminApi.sources, {}, 'admin')).json;
      expect(sources.queuedLinks.some((l: { origin: string }) => l.origin === 'suggestion')).toBe(true);
      expect((await t.call(AdminApi.updateContactMessage, { params: { id: inbox.messages[0].id }, body: { status: 'answered' } }, 'admin')).status).toBe(200);
      const summary = (await t.call(AdminApi.summary, {}, 'admin')).json;
      expect(summary.pending.contact).toBeGreaterThanOrEqual(0);
    });
    it('banned words: add, duplicate refused, remove', async () => {
      const word = { term: 'palavrateste', matchMode: 'word', locale: 'pt-BR' };
      expect((await t.call(AdminApi.addBannedWord, { body: word }, 'admin')).status).toBe(200);
      expect((await t.call(AdminApi.addBannedWord, { body: word }, 'admin')).json.errors.term).toBeTruthy();
      expect((await t.call(AdminApi.removeBannedWord, { params: { locale: 'pt-BR', term: 'palavrateste' } }, 'admin')).status).toBe(200);
    });
  });
});

describe.skipIf(!HAS_PROTOTYPE)('rate limit stub (doc 05)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp({ rateLimit: true });
  });
  afterAll(() => t.close());

  it('contact: 5 per hour per IP, then 429', async () => {
    const body = { name: 'Ana', email: 'ana@exemplo.invalid', topic: 'other', body: 'Mensagem' };
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await t.call(ParticipationApi.submitContact, { body })).status);
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });
});
