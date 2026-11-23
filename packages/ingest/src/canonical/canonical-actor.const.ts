import type { Actor } from '@was/db';

/** Actor of every write made by the canonical writer. */
export const CANONICAL_ACTOR: Actor = { userId: null, name: 'canonical writer', via: 'system:canonical' };
