import { z } from 'zod';
import { COMMENT_MAX_LENGTH } from '../consts/text-limits.const';
import { COMMENT_REACTION_VALUES } from '../enums/comment-reaction.enum';
import { COMMENT_SORT_VALUES, CommentSort } from '../enums/comment-sort.enum';
import { validateComment } from '../helpers/text-validation.helper';
import { DEFAULT_LOCALE } from '../i18n/locale.const';
import type { BannedWordRule } from '../types/banned-word.type';
import type { Locale } from '../types/locale.type';

const reaction = z.enum(COMMENT_REACTION_VALUES);

/** Query of GET /api/athletes/:slug/comments. */
export const CommentsQuerySchema = z.object({
  sort: z.enum(COMMENT_SORT_VALUES).default(CommentSort.Top).catch(CommentSort.Top),
  cursor: z.string().optional(),
});

/** One comment (plain text, rendered escaped with pre-wrap). */
export const CommentSchema = z.object({
  id: z.string().min(1),
  parentId: z.string().nullable(),
  body: z.string(),
  author: z.string().min(1),
  isMine: z.boolean(),
  at: z.iso.datetime(),
  likes: z.number().int().nonnegative(),
  dislikes: z.number().int().nonnegative(),
  myReaction: reaction.nullable(),
});

/** Top-level comment with its replies (1 level, chronological). */
export const CommentThreadSchema = CommentSchema.extend({ replies: z.array(CommentSchema) });

export const CommentsResponseSchema = z.object({
  threads: z.array(CommentThreadSchema),
  total: z.number().int().nonnegative(),
  max: z.number().int().positive(),
  nextCursor: z.string().nullable(),
});

/** Transport shape of POST /api/athletes/:slug/comments (rules applied by createCommentInputSchema). */
export const PostCommentRequestSchema = z.object({
  body: z.string(),
  /** Replying to a reply attaches to the same top-level comment. */
  parentId: z.string().nullable().optional(),
});
export const PostCommentResponseSchema = z.object({ id: z.string().min(1) });

/** Form/server validation of a comment: same rules on both sides (doc 20). */
export const createCommentInputSchema = (bannedWords: readonly BannedWordRule[], locale: Locale = DEFAULT_LOCALE) =>
  PostCommentRequestSchema.superRefine((value, ctx) => {
    const result = validateComment(value.body, bannedWords, locale);
    if (!result.ok) ctx.addIssue({ code: 'custom', path: ['body'], message: result.message, params: { error: result.error } });
  });

/** Body of PUT /api/comments/:id/reaction: like/dislike, or null to undo. */
export const ReactToCommentRequestSchema = z.object({ reaction: reaction.nullable() });
export const ReactToCommentResponseSchema = z.object({
  reaction: reaction.nullable(),
  likes: z.number().int().nonnegative(),
  dislikes: z.number().int().nonnegative(),
});

export const CommentIdParamsSchema = z.object({ id: z.string().min(1) });
