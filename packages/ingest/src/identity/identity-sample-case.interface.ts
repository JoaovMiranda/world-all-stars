import type { IdentityQuery } from './identity-query.interface';
import type { IdentitySampleCandidate } from './identity-sample-candidate.interface';

/** One labelled pair of the identity sample; `same` is the truth. */
export interface IdentitySampleCase {
  label: string;
  same: boolean;
  query: IdentityQuery;
  candidate: IdentitySampleCandidate;
}
