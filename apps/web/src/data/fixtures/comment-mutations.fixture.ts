import { API_ERROR_MESSAGES, ApiErrorCode, type ReactToCommentResponse, type SessionUser, validateComment } from '@was/shared';

import { ApiError } from '../api-error.error';
import { demoId, demoStore } from '../demo.store';
import type { loadSample } from '../sample-fixtures.helper';
import { commentRows } from './comments.fixture';

/** POST comment in fixture mode: shared validation (422 like the server), replies attach to the top comment. */
export const postDemoComment = async (sample: typeof loadSample, user: SessionUser, slug: string, body: string, parentId: string | null | undefined) => {
  const { bannedWords } = await sample('validation-context.json');
  const result = validateComment(body, bannedWords);
  if (!result.ok) throw new ApiError(422, { error: result.error, message: result.message });
  let parent: string | null = null;
  if (parentId) {
    const target = (await commentRows(sample, user)).find((c) => c.id === parentId && c.slug === slug);
    if (!target) throw new ApiError(422, { error: ApiErrorCode.Parent, message: API_ERROR_MESSAGES.parentGone });
    parent = target.parentId ?? target.id;
  }
  const id = demoId();
  demoStore.update((d) => {
    d.comments.push({ id, slug, parentId: parent, body: result.text, author: user.name, at: new Date().toISOString() });
  });
  return { id };
};

/** PUT reaction in fixture mode: one per user per comment, never on your own comment (403). */
export const reactDemoComment = async (sample: typeof loadSample, user: SessionUser, id: string, reaction: 'like' | 'dislike' | null): Promise<ReactToCommentResponse> => {
  const target = (await commentRows(sample, user)).find((c) => c.id === id);
  if (!target) throw new ApiError(404, { error: 'not_found' });
  if (target.isMine) throw new ApiError(403, { error: ApiErrorCode.Own, message: API_ERROR_MESSAGES.ownComment });
  demoStore.update((d) => {
    if (reaction) d.reactions[id] = reaction;
    else delete d.reactions[id];
  });
  const after = (await commentRows(sample, user)).find((c) => c.id === id);
  return { reaction, likes: after?.likes ?? 0, dislikes: after?.dislikes ?? 0 };
};
