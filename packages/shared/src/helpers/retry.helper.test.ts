import { describe, expect, it, vi } from 'vitest';

import { retryWithBackoff } from './retry.helper';

class RateLimited extends Error {
  constructor(readonly retryAfterMs: number) {
    super('429');
  }
}

const retryAfter = (error: unknown) => (error instanceof RateLimited ? error.retryAfterMs : undefined);

describe('retryWithBackoff', () => {
  it('waits the Retry-After of the error, then succeeds', async () => {
    const sleep = vi.fn(async () => {});
    const fn = vi.fn().mockRejectedValueOnce(new RateLimited(1500)).mockResolvedValueOnce('ok');
    await expect(retryWithBackoff(fn, { attempts: 4, retryAfterMs: retryAfter, sleep })).resolves.toBe('ok');
    expect(sleep).toHaveBeenCalledWith(1500);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('rethrows errors without a derivable wait immediately', async () => {
    const sleep = vi.fn(async () => {});
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(retryWithBackoff(fn, { attempts: 4, retryAfterMs: retryAfter, sleep })).rejects.toThrow('boom');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('rethrows the last failure after all attempts', async () => {
    const sleep = vi.fn(async () => {});
    const fn = vi.fn().mockRejectedValue(new RateLimited(10));
    await expect(retryWithBackoff(fn, { attempts: 3, retryAfterMs: retryAfter, sleep })).rejects.toBeInstanceOf(RateLimited);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('backs off exponentially with jitter and reports each retry', async () => {
    const sleep = vi.fn(async () => {});
    const onRetry = vi.fn();
    const fn = vi.fn().mockRejectedValueOnce(new Error('a')).mockRejectedValueOnce(new Error('b')).mockResolvedValueOnce(1);
    await retryWithBackoff(fn, { attempts: 3, baseMs: 100, jitter: 0.5, random: () => 1, sleep, onRetry });
    expect(sleep.mock.calls).toEqual([[150], [300]]);
    expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 150, 0);
    expect(fn.mock.calls.map((c) => c[0])).toEqual([0, 1, 2]);
  });

  it('rejects invalid attempts', async () => {
    await expect(retryWithBackoff(async () => 1, { attempts: 0 })).rejects.toThrow(RangeError);
  });
});
