/**
 * Base of every in-process periodic job. `start()` runs `tick()` every `intervalMs` (and once after `initialDelayMs`
 * when set); it does nothing when `intervalMs <= 0` (job disabled by config). Timers are unref'd so they never keep the
 * process alive; a failing tick is logged and the schedule goes on. Ticks never overlap.
 */
export abstract class BaseScheduler {
  private timers: ReturnType<typeof setTimeout>[] = [];
  private running: Promise<void> | null = null;

  constructor(protected readonly log: (message: string) => void = console.log) {}

  /** Short name used in log lines (`[name] …`). */
  protected abstract readonly name: string;

  /** Period in milliseconds; `<= 0` disables the scheduler. */
  protected abstract get intervalMs(): number;

  /** First run after this delay (default: no early run, first tick after one interval). */
  protected get initialDelayMs(): number | null {
    return null;
  }

  /** One unit of work. */
  protected abstract tick(): Promise<void>;

  get enabled(): boolean {
    return this.intervalMs > 0;
  }

  get started(): boolean {
    return this.timers.length > 0;
  }

  /** Runs one tick now, guarded: errors are logged, a tick already in flight is awaited instead of doubled. */
  async runOnce(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.tick()
      .catch((error: unknown) => console.error(`[${this.name}] failed`, error))
      .finally(() => {
        this.running = null;
      });
    return this.running;
  }

  /** Starts the timers (idempotent). Returns `stop` for convenience. */
  start(): () => void {
    if (!this.enabled || this.started) return () => this.stop();
    const interval = setInterval(() => void this.runOnce(), this.intervalMs);
    interval.unref?.();
    this.timers.push(interval);
    const delay = this.initialDelayMs;
    if (delay !== null) {
      const first = setTimeout(() => void this.runOnce(), delay);
      first.unref?.();
      this.timers.push(first);
    }
    return () => this.stop();
  }

  stop(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }
}
