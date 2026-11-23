import { afterEach, describe, expect, it, vi } from 'vitest';

import { sleep } from './sleep.helper';

describe('sleep', () => {
  afterEach(() => vi.useRealTimers());

  it('resolves after the delay', async () => {
    vi.useFakeTimers();
    let done = false;
    const p = sleep(100).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(99);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(done).toBe(true);
  });

  it('rejects with the abort reason', async () => {
    const controller = new AbortController();
    const p = sleep(10_000, controller.signal);
    controller.abort(new Error('stop'));
    await expect(p).rejects.toThrow('stop');
  });

  it('rejects at once when the signal is already aborted', async () => {
    await expect(sleep(10, AbortSignal.abort(new Error('late')))).rejects.toThrow('late');
  });
});
