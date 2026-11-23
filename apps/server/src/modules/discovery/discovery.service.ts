import type { CollectionRun } from '@was/shared';

import { BaseService } from '../../core/base.service';
import { DiscoveryRepository } from './discovery.repository';

/** Public collection log (AI-assisted runs). */
export class DiscoveryService extends BaseService {
  listCollectionRuns(): Promise<CollectionRun[]> {
    return new DiscoveryRepository(this.db).listCollectionRuns();
  }
}
