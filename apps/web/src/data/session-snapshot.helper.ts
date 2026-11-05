import { SessionKind, type SessionUser } from '@was/shared';

import { sessionStore } from '@/session/session.store';

import { demoStore } from './demo.store';
import { loadSample } from './sample-fixtures.helper';

/** Current simulated session with the demo counters applied (fixture mode only). */
export const sessionSnapshot = async (): Promise<{ kind: SessionKind; user: SessionUser | null }> => {
  const kind = sessionStore.get();
  if (kind === SessionKind.Anon) return { kind, user: null };
  const users = await loadSample('session-users.json');
  const base = kind === SessionKind.Admin ? users.admin : users.reader;
  const demo = demoStore.get();
  return {
    kind,
    user: {
      ...base,
      tierVotesCount: base.tierVotesCount + Object.keys(demo.votes).length,
      commentsCount: base.commentsCount + demo.comments.filter((c) => c.author === base.name).length,
    },
  };
};
