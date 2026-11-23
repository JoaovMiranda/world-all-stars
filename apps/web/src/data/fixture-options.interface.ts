import type { ApiContract } from '@was/shared';
import type { FixtureHandler } from './fixture-context.type';

export interface FixtureOptions<C extends ApiContract> {
  /** Response in sample mode (and for mutations in every mode except loading/error). */
  sample: FixtureHandler<C>;
  /** Response in empty mode. 'not-found' = 404 (entity absent from an empty database). Default: derived from the schema. */
  empty?: FixtureHandler<C> | 'not-found';
  /** Same response in every mode (e.g. the session itself). */
  modeIndependent?: boolean;
}
