import type { AdminContactMessage, AdminSuggestion, CommentReaction, SuggestionStatus, Tier } from '@was/shared';
import type { DemoComment } from './demo-comment.interface';
import type { AdminDemoState } from './fixtures/admin-demo.type';

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
  /** My exclusive star (D02): athlete slug + when, or null. */
  star: { slug: string; at: string } | null;
  /** My hearts (D02): athlete slug → when. */
  hearts: Record<string, string>;
  /** Admin decisions (A1–A8), see fixtures/admin-demo.type.ts. */
  admin: AdminDemoState;
}
