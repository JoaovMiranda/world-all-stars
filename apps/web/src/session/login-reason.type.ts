import type { SESSION_TEXT } from './session.const';

export type LoginReason = keyof typeof SESSION_TEXT.reasons;
