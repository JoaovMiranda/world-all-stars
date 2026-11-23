/** Who writes: a user (id + display name) or the system (null id). `via` goes to created_via ('user', 'seed', 'system:x'). */
export interface Actor {
  userId: string | null;
  name?: string | null;
  via?: string;
  ipHash?: string | null;
  userAgent?: string | null;
}
