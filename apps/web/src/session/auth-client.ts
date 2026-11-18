import { AUTH_BASE_PATH } from './session.const';

type AuthClient = ReturnType<typeof import('better-auth/client').createAuthClient>;
let client: Promise<AuthClient> | undefined;

/**
 * Better Auth browser client (same origin: the Hono server mounts /api/auth). Loaded on demand, only in the browser:
 * the SSR and the first paint never ship it.
 */
const authClient = (): Promise<AuthClient> =>
  (client ??= import('better-auth/client').then(({ createAuthClient }) => createAuthClient({ baseURL: window.location.origin, basePath: AUTH_BASE_PATH })));

/** Google sign-in (redirects to Google, then back to `callbackURL`: the page the user was on). */
export const signInWithGoogle = async (callbackURL: string = window.location.href): Promise<void> => {
  const auth = await authClient();
  const result = await auth.signIn.social({ provider: 'google', callbackURL, errorCallbackURL: callbackURL });
  if (result.error) throw new Error(result.error.message ?? result.error.statusText);
};

/** Ends the Better Auth session (deletes its row and the `was.session_token` cookie). No-op when signed out. */
export const signOutOfAuth = async (): Promise<void> => {
  const auth = await authClient();
  await auth.signOut();
};
