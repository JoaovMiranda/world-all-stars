import type { Actor, BaseRepository, Database } from '@was/db';

import { notFound } from '../http/http-error.helper';
import type { RequestContext } from './request-context.interface';

/**
 * Base of every service (business rules of one module). Built per request with the `RequestContext`; writes only
 * through `repo` (versioning + audit + soft delete), reads through read repositories or `db`. Never knows HTTP
 * beyond throwing `HttpError`s.
 */
export abstract class BaseService {
  constructor(protected readonly ctx: RequestContext) {}

  /** The only writer. */
  protected get repo(): BaseRepository {
    return this.ctx.deps.repo;
  }

  protected get db(): Database {
    return this.ctx.deps.db;
  }

  /** Who is acting (user or system), for writes and audit entries. */
  protected get actor(): Actor {
    return this.ctx.actor;
  }

  /** Appends an audit entry as the current actor. */
  protected audit(
    action: string,
    entity: { type: string; id: string | null; version?: number | null } | null,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    return this.repo.audit(this.actor, action, entity, metadata);
  }

  /** Runs `fn` in one transaction; inside it use only the given `repo` (PGlite has a single connection). */
  protected transaction<T>(fn: (repo: BaseRepository) => Promise<T>): Promise<T> {
    return this.repo.transaction(fn);
  }

  /** Returns `value`, or throws the 404 `HttpError` when it is missing. */
  protected notFound<T>(value: T | null | undefined): T {
    if (value === null || value === undefined) throw notFound();
    return value;
  }
}
