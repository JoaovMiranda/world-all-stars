import { type AdminContactMessage, type AdminSuggestion, type CommentReaction, type SuggestionStatus, type Tier, submissionProtocol } from '@was/shared';

import { IS_SERVER } from '@/app/request-scope';

import { type AdminDemoState, initialAdminDemo } from './fixtures/admin-demo.type';

const STORAGE_KEY = 'was-demo';

export interface DemoComment {
  id: string;
  slug: string;
  parentId: string | null;
  body: string;
  author: string;
  at: string;
}

/** What the tester did in fixture mode (votes, comments, reactions, admin decisions, submissions). */
export interface DemoState {
  votes: Record<string, { tier: Tier; at: string }>;
  comments: DemoComment[];
  reactions: Record<string, CommentReaction>;
  officialTiers: Record<string, { tier: Tier; reason: string; at: string }>;
  hiddenComments: Record<string, string>;
  deletedComments: string[];
  readNotifications: string[];
  suggestions: AdminSuggestion[];
  messages: AdminContactMessage[];
  reviewedSuggestions: Record<string, SuggestionStatus>;
  /** Optional consents granted/revoked in /me/data (E6), by purpose. */
  consents: Record<string, { granted: boolean; at: string }>;
  /** Admin decisions (A1–A8), see fixtures/admin-demo.type.ts. */
  admin: AdminDemoState;
}

const initial = (): DemoState => ({
  votes: {},
  comments: [],
  reactions: {},
  officialTiers: {},
  hiddenComments: {},
  deletedComments: [],
  readNotifications: [],
  suggestions: [],
  messages: [],
  reviewedSuggestions: {},
  consents: {},
  admin: initialAdminDemo(),
});

const read = (): DemoState => {
  // The server render never sees the tester's demo changes (they live in this browser); the client overlays them
  // after hydration (entry-client invalidates the queries when there is something stored).
  if (IS_SERVER) return initial();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initial(), ...(JSON.parse(raw) as Partial<DemoState>) } : initial();
  } catch {
    return initial();
  }
};

let state: DemoState | null = null;
const current = (): DemoState => (state ??= read());

/**
 * In-memory + localStorage store of the fixture-mode mutations (same idea as the prototype's session.helper.js).
 * Fixture handlers read it to overlay the sample data; "Limpar … da demo" resets it.
 */
export const demoStore = {
  get: (): DemoState => current(),
  /** True when this browser has demo changes stored (fixture mode overlays them after hydration). */
  hasStored(): boolean {
    if (IS_SERVER) return false;
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  },
  update(recipe: (draft: DemoState) => void): void {
    const draft = structuredClone(current());
    recipe(draft);
    state = draft;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage blocked: keep in memory */
    }
  },
  reset(): void {
    state = initial();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage blocked */
    }
  },
};

/** Ids of demo records (`demo-<time>-<rand>`), never colliding with sample uuids. */
export const demoId = (): string => `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
/** Protocol shown after a submission (SUG-123456 / CTT-123456, doc 21). */
export const demoProtocol = (prefix: 'SUG' | 'CTT'): string => submissionProtocol(prefix);
