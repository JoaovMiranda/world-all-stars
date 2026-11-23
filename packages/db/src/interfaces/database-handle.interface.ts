import type { Database, DatabaseDriver } from '../types/database.type';

export interface DatabaseHandle {
  db: Database;
  driver: DatabaseDriver;
  /** Where the data lives (PGlite dir, `memory://` or the Postgres URL without password). */
  location: string;
  migrate(): Promise<void>;
  close(): Promise<void>;
}
