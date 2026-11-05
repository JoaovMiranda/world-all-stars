import { API_ERROR_MESSAGES, ApiErrorCode, type SessionUser } from '@was/shared';

import { ApiError } from '../api-error.error';

/** Signed-in user of a fixture context (401 like the API when anonymous). */
export const requireUser = (session: { user: SessionUser | null }): SessionUser => {
  if (!session.user) throw new ApiError(401, { error: ApiErrorCode.Auth, message: API_ERROR_MESSAGES.signIn });
  return session.user;
};
