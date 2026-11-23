/** The part of Better Auth the provider needs (tests stub it). */
export interface SessionLookup {
  getSession(input: { headers: Headers }): Promise<{ user: { id: string } } | null>;
}
