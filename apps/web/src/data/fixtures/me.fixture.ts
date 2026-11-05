import { type MeResponse, NotificationKind, type NotificationsResponse, type SessionUser } from '@was/shared';

import { demoStore } from '../demo.store';
import type { loadSample } from '../sample-fixtures.helper';
import { commentRows } from './comments.fixture';
import { withDemoTier } from './demo-tier.fixture';

const refs = async (sample: typeof loadSample) =>
  new Map((await sample('athletes.json')).items.map((a) => [a.slug, withDemoTier({ slug: a.slug, knownAs: a.knownAs, tier: a.tier })]));

/** GET /api/me: votes and comments of the simulated user. */
export const buildMe = async (sample: typeof loadSample, user: SessionUser): Promise<MeResponse> => {
  const [athletes, rows] = await Promise.all([refs(sample), commentRows(sample, user)]);
  const votes = Object.entries(demoStore.get().votes).flatMap(([slug, v]) => {
    const athlete = athletes.get(slug);
    return athlete ? [{ athlete, tier: v.tier, at: v.at }] : [];
  });
  const comments = rows
    .filter((c) => c.isMine)
    .flatMap((c) => {
      const athlete = athletes.get(c.slug);
      return athlete ? [{ id: c.id, athlete, body: c.body, at: c.at, isReply: c.parentId !== null }] : [];
    })
    .sort((a, b) => b.at.localeCompare(a.at));
  return { user, votes, comments };
};

/** GET /api/notifications: replies by others to my comments (E4). */
export const buildNotifications = async (sample: typeof loadSample, user: SessionUser): Promise<NotificationsResponse> => {
  const [athletes, rows] = await Promise.all([refs(sample), commentRows(sample, user)]);
  const mine = new Set(rows.filter((c) => c.isMine).map((c) => c.id));
  const read = new Set(demoStore.get().readNotifications);
  const items = rows
    .filter((c) => c.parentId && mine.has(c.parentId) && !c.isMine)
    .map((c) => ({
      id: `n-${c.id}`,
      kind: NotificationKind.CommentReply,
      read: read.has(`n-${c.id}`),
      at: c.at,
      actor: c.author,
      excerpt: c.body.slice(0, 140),
      athlete: athletes.get(c.slug) ?? null,
      commentId: c.id,
    }))
    .sort((a, b) => b.at.localeCompare(a.at));
  return { items, unread: items.filter((n) => !n.read).length };
};
