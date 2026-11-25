// Comments completeness (T3.3): 10-minute edit window, reports → moderation queue, banned words per locale, daily cap,
// soft delete. Cursor pagination and the per-minute limit are covered in mutations.test.ts / rate-limit.test.ts.
import { bannedWords, comments, SYSTEM_ACTOR } from '@was/db';
import { COMMENT_EDIT_WINDOW_MS, CommentSort, isCommentFlagged, ParticipationApi, RATE_LIMITS } from '@was/shared';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { HttpError } from '../http/http-error.error';
import { AdminCommunityService } from '../modules/admin/admin-community.service';
import { CommentsService } from '../modules/comments/comments.service';
import { HAS_PROTOTYPE } from './test-app.const';
import { createTestApp } from './test-app.helper';
import type { TestApp } from './test-app.interface';
import { createTestUser, readerContext } from './test-user.helper';

const statusOf = async (p: Promise<unknown>) => {
  try {
    await p;
    return 200;
  } catch (error) {
    return error instanceof HttpError ? error.status : 500;
  }
};

describe.skipIf(!HAS_PROTOTYPE)('comments completeness (T3.3)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  const author = async (label: string) => {
    const user = await createTestUser(t, label);
    return { user, svc: new CommentsService(readerContext(t, user)) };
  };
  const find = async (id: string) => (await t.deps.db.select().from(comments).where(eq(comments.id, id)))[0]!;

  it('the author edits within 10 minutes (validated, marked as edited); others cannot; after the window it is refused', async () => {
    const a = await author('editor');
    const b = await author('not-the-author');
    const { id } = await a.svc.postComment(a.user, 'pele', 'Primeira versão do comentário', null);

    const listed = (await a.svc.listComments('pele', CommentSort.Recent)).threads.find((c) => c.id === id)!;
    expect(listed.editableUntil).toBeTruthy();
    expect(listed.editedAt ?? null).toBeNull();
    expect((await b.svc.listComments('pele', CommentSort.Recent)).threads.find((c) => c.id === id)!.editableUntil).toBeUndefined();

    const edited = await a.svc.editComment(a.user, id, 'Segunda versão do comentário');
    expect((await find(id)).body).toBe('Segunda versão do comentário');
    expect((await a.svc.listComments('pele', CommentSort.Recent)).threads.find((c) => c.id === id)!.editedAt).toBe(edited.editedAt);

    expect(await statusOf(b.svc.editComment(b.user, id, 'Tentativa de outra pessoa'))).toBe(403);
    expect(await statusOf(a.svc.editComment(a.user, id, '   '))).toBe(422);

    await t.deps.db
      .update(comments)
      .set({ createdAt: new Date(Date.now() - COMMENT_EDIT_WINDOW_MS - 1000) })
      .where(eq(comments.id, id));
    const late = await a.svc.editComment(a.user, id, 'Tarde demais').catch((e: unknown) => e);
    expect((late as HttpError).status).toBe(422);
    expect((late as HttpError).body.error).toBe('edit_window_closed');
  });

  it('banned words of every locale apply to posts and edits', async () => {
    const term = `proibidoes${Date.now()}`;
    await t.deps.repo.insert(bannedWords, { term, matchMode: 'word', locale: 'es' }, SYSTEM_ACTOR);
    const a = await author('banned');
    expect(await statusOf(a.svc.postComment(a.user, 'pele', `texto com ${term}`, null))).toBe(422);
    const { id } = await a.svc.postComment(a.user, 'pele', 'texto limpo', null);
    expect(await statusOf(a.svc.editComment(a.user, id, `agora com ${term}`))).toBe(422);
  });

  it('report: once per reader (idempotent), never your own; reported comments enter the moderation queue', async () => {
    const a = await author('reported-author');
    const { id } = await a.svc.postComment(a.user, 'pele', 'Comentário que vai ser denunciado', null);
    expect(await statusOf(a.svc.reportComment(a.user, id, undefined))).toBe(403);
    const r1 = await author('reporter-1');
    const r2 = await author('reporter-2');
    await Promise.all([r1.svc.reportComment(r1.user, id, 'ofensivo'), r1.svc.reportComment(r1.user, id, 'ofensivo')]);
    await r1.svc.reportComment(r1.user, id, undefined);
    expect((await find(id)).reportsCount).toBe(1);
    await r2.svc.reportComment(r2.user, id, undefined);
    expect((await find(id)).reportsCount).toBe(2);

    const queue = await new AdminCommunityService(readerContext(t, r2.user)).listAdminComments();
    const item = queue.items.find((c) => c.id === id)!;
    expect(item.reports).toBe(2);
    expect(isCommentFlagged(item)).toBe(true);
    expect(queue.items[0]!.reports).toBeGreaterThanOrEqual(2);
    expect((await t.call(ParticipationApi.reportComment, { params: { id }, body: {} })).status).toBe(401);
  });

  it('soft delete: the author removes the comment; the row stays (deleted_at) and leaves the thread', async () => {
    const a = await author('deleter');
    const { id } = await a.svc.postComment(a.user, 'pele', 'Vou apagar este', null);
    await a.svc.deleteComment(a.user, id);
    expect((await find(id)).deletedAt).not.toBeNull();
    expect((await a.svc.listComments('pele', CommentSort.Recent)).threads.some((c) => c.id === id)).toBe(false);
    expect(await statusOf(a.svc.editComment(a.user, id, 'ressuscitar'))).toBe(404);
  });
});

describe.skipIf(!HAS_PROTOTYPE)('comments daily cap (T3.3)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp({ rateLimit: true });
  });
  afterAll(() => t.close());

  it(`an account posts at most ${RATE_LIMITS.commentDaily.max} comments a day (429 afterwards)`, async () => {
    const user = await createTestUser(t, 'chatty');
    const svc = new CommentsService(readerContext(t, user));
    for (let i = 0; i < RATE_LIMITS.commentDaily.max; i++) await svc.postComment(user, 'pele', `comentário número ${i}`, null);
    expect(await statusOf(svc.postComment(user, 'pele', 'um a mais', null))).toBe(429);
  });
});
