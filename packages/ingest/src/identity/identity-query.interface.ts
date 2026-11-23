/** The person an observation names, as the identity resolver sees it. */
export interface IdentityQuery {
  name: string;
  externalIds: Record<string, string>;
  sport: string | null;
  birthDate?: string | null;
}
