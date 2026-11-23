import { auditLogs, SYSTEM_ACTOR } from '@was/db';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { HttpError } from '../http/http-error.error';
import { createTestApp } from '../test/test-app.helper';
import type { TestApp } from '../test/test-app.interface';
import { BaseController } from './base.controller';
import { BaseMapper } from './base.mapper';
import { BaseScheduler } from './base.scheduler';
import { BaseService } from './base.service';
import type { RequestContext } from './request-context.interface';

class EchoService extends BaseService {
  find(id: string | null) {
    return this.notFound(id);
  }
  record(action: string) {
    return this.audit(action, { type: 'probe', id: null }, { ok: true });
  }
  inTransaction() {
    return this.transaction(async (repo) => repo !== this.repo);
  }
  get locale() {
    return this.ctx.locale;
  }
}

class EchoController extends BaseController {
  show(input: { id: string }) {
    const service = this.service(EchoService);
    return { id: service.find(input.id), locale: service.locale };
  }
}

class UpperMapper extends BaseMapper<{ name: string }, { label: string }> {
  map(row: { name: string }) {
    return { label: row.name.toUpperCase() };
  }
}

class CountingScheduler extends BaseScheduler {
  protected readonly name = 'probe';
  ticks = 0;
  fail = false;
  constructor(
    private readonly every: number,
    private readonly firstAfter: number | null = null,
  ) {
    super(() => undefined);
  }
  protected get intervalMs() {
    return this.every;
  }
  protected override get initialDelayMs() {
    return this.firstAfter;
  }
  protected async tick() {
    this.ticks++;
    if (this.fail) throw new Error('tick failed');
  }
}

describe('server core bases', () => {
  let t: TestApp;
  let ctx: RequestContext;
  beforeAll(async () => {
    t = await createTestApp({ seed: false });
    ctx = {
      deps: t.deps,
      session: { kind: 'anon', user: null, pending: null, source: null } as RequestContext['session'],
      actor: SYSTEM_ACTOR,
      ipHash: 'test',
      locale: 'en',
    };
  });
  afterAll(() => t.close());
  afterEach(() => vi.useRealTimers());

  it('BaseService throws 404 for missing values and audits as the actor', async () => {
    const service = new EchoService(ctx);
    expect(() => service.find(null)).toThrow(HttpError);
    expect(service.find('x')).toBe('x');
    await service.record('probe.checked');
    const rows = await t.deps.db.select().from(auditLogs).where(eq(auditLogs.action, 'probe.checked'));
    expect(rows).toHaveLength(1);
    expect(await service.inTransaction()).toBe(true);
  });

  it('BaseController builds services with the same request context', () => {
    expect(new EchoController(ctx).show({ id: 'pele' })).toEqual({ id: 'pele', locale: 'en' });
  });

  it('BaseMapper maps one row and many rows', () => {
    const mapper = new UpperMapper();
    expect(mapper.map({ name: 'pele' })).toEqual({ label: 'PELE' });
    expect(mapper.mapMany([{ name: 'a' }, { name: 'b' }])).toEqual([{ label: 'A' }, { label: 'B' }]);
  });

  it('BaseScheduler is disabled when the interval is 0', () => {
    const scheduler = new CountingScheduler(0);
    scheduler.start();
    expect(scheduler.enabled).toBe(false);
    expect(scheduler.started).toBe(false);
  });

  it('BaseScheduler ticks on its interval, logs failures and stops', async () => {
    vi.useFakeTimers();
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const scheduler = new CountingScheduler(1000, 10);
    const stop = scheduler.start();
    scheduler.start();
    await vi.advanceTimersByTimeAsync(10);
    expect(scheduler.ticks).toBe(1);
    scheduler.fail = true;
    await vi.advanceTimersByTimeAsync(1000);
    expect(scheduler.ticks).toBe(2);
    expect(error).toHaveBeenCalledWith('[probe] failed', expect.any(Error));
    stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(scheduler.ticks).toBe(2);
    error.mockRestore();
  });

  it('BaseScheduler never overlaps ticks', async () => {
    const scheduler = new CountingScheduler(1000);
    await Promise.all([scheduler.runOnce(), scheduler.runOnce()]);
    expect(scheduler.ticks).toBe(1);
  });
});
