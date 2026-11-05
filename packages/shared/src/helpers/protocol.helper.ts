/** Protocol shown after a public submission (doc 21): `SUG-123456` (suggestion) / `CTT-123456` (contact). */
export const submissionProtocol = (prefix: 'SUG' | 'CTT', now: number = Date.now()): string => `${prefix}-${String(now).slice(-6)}`;
