import { BaseService } from '../../core/base.service';
import type { CatalogView } from './catalog.view';

/** Read access to the in-memory catalog snapshot (CatalogCache) in the language of the request. */
export class CatalogService extends BaseService {
  view(): Promise<CatalogView> {
    return this.ctx.deps.catalog.get(this.ctx.locale);
  }
}
