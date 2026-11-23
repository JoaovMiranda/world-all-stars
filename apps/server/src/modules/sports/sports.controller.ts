import { addDaysIso, type PublicApi, toIsoDate } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { notFound } from '../../http/http-error.helper';
import { CatalogService } from '../catalog/catalog.service';

/** The "Upcoming championships" section of a sport page: from today to this horizon. */
const SPORT_UPCOMING_DAYS = 425;

/** P6/P7 + governance models and the organization hierarchy (docs 18/19). */
export class SportsController extends BaseController {
  private view() {
    return this.service(CatalogService).view();
  }

  async sports() {
    return (await this.view()).sportsTree();
  }

  async sportPage({ params }: ContractInputOf<typeof PublicApi.sportPage>) {
    const today = toIsoDate(new Date());
    const page = (await this.view()).sportPage(params.slug, today, addDaysIso(today, SPORT_UPCOMING_DAYS));
    if (!page) throw notFound();
    return page;
  }

  async governanceModels() {
    return (await this.view()).governanceModels();
  }

  async organizations() {
    return (await this.view()).orgTree();
  }
}
