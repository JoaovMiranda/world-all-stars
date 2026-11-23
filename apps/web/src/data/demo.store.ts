import { submissionProtocol } from '@was/shared';
import { IS_SERVER } from '@/app/request-scope.const';
import type { DemoState } from './demo-state.interface';
import { initialAdminDemo } from './fixtures/admin-demo.type';

const STORAGE_KEY = 'was-demo';

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
 * Fixture handlers read it to overlay the sample data; "Clear demo …" resets it.
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
