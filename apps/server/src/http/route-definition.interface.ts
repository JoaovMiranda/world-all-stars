import type { ApiContract } from '@was/shared';

import type { ContractHandler } from './contract-handler.type';
import type { RouteOptions } from './route-options.interface';

export interface RouteDefinition {
  contract: ApiContract;
  handler: ContractHandler<ApiContract>;
  options: RouteOptions;
}
