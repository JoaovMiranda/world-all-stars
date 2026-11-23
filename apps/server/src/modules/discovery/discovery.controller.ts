import type { PublicApi } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { CatalogService } from '../catalog/catalog.service';
import { ValidationContextService } from '../moderation/validation-context.service';
import { DiscoveryService } from './discovery.service';

/** Hall of Greats, sources, collection runs, calendar, on this day, validation context. */
export class DiscoveryController extends BaseController {
  private view() {
    return this.service(CatalogService).view();
  }

  async hallOfGreats() {
    const view = await this.view();
    return { greats: view.hallOfGreats(), candidates: view.candidates(), contentLocale: view.hallContentLocale() };
  }

  async sources() {
    return (await this.view()).sourcesOverview();
  }

  collectionRuns() {
    return this.service(DiscoveryService).listCollectionRuns();
  }

  async calendar({ query }: ContractInputOf<typeof PublicApi.calendar>) {
    return (await this.view()).calendar(query.from, query.to).filter((e) => !query.sport || e.sport?.slug === query.sport);
  }

  async onThisDay({ params }: ContractInputOf<typeof PublicApi.onThisDay>) {
    return (await this.view()).onThisDay(params.md);
  }

  validationContext() {
    return this.service(ValidationContextService).getValidationContext();
  }
}
