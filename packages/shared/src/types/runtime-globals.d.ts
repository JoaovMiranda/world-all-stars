// Timers and AbortSignal exist in every runtime the shared package targets (browsers, Node ≥ 18, workers), but the
// package compiles without DOM/Node libs on purpose. Minimal ambient surface used by `sleep` and `retryWithBackoff`.
type TimerHandle = number | { readonly __timer: unique symbol };
declare function setTimeout(callback: () => void, ms?: number): TimerHandle;
declare function clearTimeout(handle: TimerHandle | undefined): void;
declare class AbortSignal {
  static abort(reason?: unknown): AbortSignal;
  readonly aborted: boolean;
  readonly reason: unknown;
  addEventListener(type: 'abort', listener: () => void, options?: { once?: boolean }): void;
  removeEventListener(type: 'abort', listener: () => void): void;
}
declare class AbortController {
  readonly signal: AbortSignal;
  abort(reason?: unknown): void;
}
