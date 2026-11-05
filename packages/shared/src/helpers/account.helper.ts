/** Public pseudonym of an anonymized (deleted) account: comments and votes stay under it (doc 13). */
export const anonymizedUserName = (seed: number): string => `Usuário removido #${String(Math.abs(Math.trunc(seed)) % 10000).padStart(4, '0')}`;
