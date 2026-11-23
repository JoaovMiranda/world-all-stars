/**
 * Identity before GET /api/session answers (and of every visitor without an account). The `identity:` prefix keeps it
 * apart from the other key items (the simulated kind is also 'anon'), so the old identity's queries can be found.
 */
export const ANON_IDENTITY = 'identity:anon';
