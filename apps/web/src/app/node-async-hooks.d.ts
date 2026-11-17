// The web tsconfig has no Node types (browser code); entry-server only needs this from node:async_hooks.
declare module 'node:async_hooks' {
  export class AsyncLocalStorage<T> {
    getStore(): T | undefined;
    run<R>(store: T, callback: () => R): R;
  }
}
