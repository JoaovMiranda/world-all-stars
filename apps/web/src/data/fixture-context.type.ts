import type { ApiContract, ContractInput, SessionKind, SessionUser } from '@was/shared';

import type { loadSample } from './sample-fixtures.helper';

/** What a fixture handler receives: the typed input, the sample loader and the simulated session. */
export interface FixtureContext<C extends ApiContract> {
  input: ContractInput<C>;
  sample: typeof loadSample;
  session: { kind: SessionKind; user: SessionUser | null };
}

/** Produces the raw response of an endpoint from fixtures (validated by the contract afterwards). */
export type FixtureHandler<C extends ApiContract> = (ctx: FixtureContext<C>) => unknown;
