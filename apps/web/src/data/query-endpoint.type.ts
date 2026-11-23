import type { ApiContract } from '@was/shared';
import type { defineQuery } from './define-endpoint.helper';

export type QueryEndpoint = ReturnType<typeof defineQuery<ApiContract>>;
