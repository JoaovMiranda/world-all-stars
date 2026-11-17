import { type ApiContract, FixtureMode, accessDenial } from '@was/shared';

import { IS_SERVER } from '@/app/request-scope';

import { ApiError } from './api-error.error';
import { FIXTURE_LATENCY_MS } from './data-layer.const';
import { emptyOf } from './empty-response.helper';
import type { FixtureHandler } from './fixture-context.type';
import { loadSample } from './sample-fixtures.helper';
import { sessionSnapshot } from './session-snapshot.helper';

export interface FixtureOptions<C extends ApiContract> {
  /** Response in sample mode (and for mutations in every mode except loading/error). */
  sample: FixtureHandler<C>;
  /** Response in empty mode. 'not-found' = 404 (entity absent from an empty database). Default: derived from the schema. */
  empty?: FixtureHandler<C> | 'not-found';
  /** Same response in every mode (e.g. the session itself). */
  modeIndependent?: boolean;
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

const never = (signal?: AbortSignal) => new Promise<never>((_, reject) => signal?.addEventListener('abort', () => reject(signal.reason)));

/** Executes the fixture of an endpoint for the current mode, enforcing the contract access rule like the API would. */
export const runFixture = async <C extends ApiContract>(
  contract: C,
  options: FixtureOptions<C>,
  input: unknown,
  mode: FixtureMode,
  signal?: AbortSignal,
): Promise<unknown> => {
  const effective = options.modeIndependent ? FixtureMode.Sample : mode;
  if (effective === FixtureMode.Loading) return never(signal);
  // Latency only in the browser (keeps skeletons visible); the server render answers at once.
  if (!IS_SERVER) await wait(FIXTURE_LATENCY_MS, signal);
  if (effective === FixtureMode.Error) throw new ApiError(503, { error: 'fixture_error', message: 'Falha simulada (?fixture=error).' });

  const session = await sessionSnapshot();
  const denial = accessDenial(contract.access, session.kind);
  if (denial) throw new ApiError(denial.status, denial.body);

  const ctx = { input: input as never, sample: loadSample, session };
  const isMutation = contract.method !== 'GET';
  if (effective === FixtureMode.Empty && !isMutation) {
    if (options.empty === 'not-found') throw new ApiError(404, { error: 'not_found' });
    return options.empty ? options.empty(ctx) : emptyOf(contract.response);
  }
  return options.sample(ctx);
};
