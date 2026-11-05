import type { AdminContactMessage, AdminSuggestion, CommentReaction, SuggestionStatus, Tier } from '@was/shared';

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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initial(), ...(JSON.parse(raw) as Partial<DemoState>) } : initial();
  } catch {
    return initial();
  }
};

let state: DemoState = read();

/**
 * In-memory + localStorage store of the fixture-mode mutations (same idea as the prototype's session.helper.js).
 * Fixture handlers read it to overlay the sample data; "Limpar … da demo" resets it.
 */
export const demoStore = {
  get: (): DemoState => state,
  update(recipe: (draft: DemoState) => void): void {
    const draft = structuredClone(state);
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
export const demoProtocol = (prefix: 'SUG' | 'CTT'): string => `${prefix}-${String(Date.now()).slice(-6)}`;
