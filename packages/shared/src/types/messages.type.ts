import type { Locale } from './locale.type';

/**
 * Shape a translation must have: the same keys as the pt-BR source, strings as `string` (not the pt literal), and
 * message functions with the same parameters. Arrays/tuples keep their length (one translated item per pt item).
 */
export type Messages<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends (...args: infer A) => infer R
        ? (...args: A) => Messages<R>
        : T extends object
          ? { readonly [K in keyof T]: Messages<T[K]> }
          : T;

/** A dictionary in every supported language (built by `defineMessages`, read by `textFor` / `useText`). */
export type LocalizedMessages<T> = { readonly [L in Locale]: Messages<T> } & { readonly __messages: true };
