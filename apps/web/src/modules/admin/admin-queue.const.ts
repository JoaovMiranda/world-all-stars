import { ADMIN_REASON_MIN_LENGTH } from '@was/shared';

/** Required reason of admin decisions (same minimum as the shared request schemas). */
export const ADMIN_REASON = { minLength: ADMIN_REASON_MIN_LENGTH } as const;
