/** Pragmatic e-mail check (same as the prototype): something@domain.tld, no spaces. */
export const isEmail = (value: unknown): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());
