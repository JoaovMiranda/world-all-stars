import { composeHome, homeCalendarWindow, monthDayOfIso, type PublicApi } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { CatalogService } from '../catalog/catalog.service';

/** P1: one round trip, composed by the same shared function as the web fixtures (composeHome). */
export class HomeController extends BaseController {
  async home({ query }: ContractInputOf<typeof PublicApi.home>) {
    const view = await this.service(CatalogService).view();
    const window = homeCalendarWindow(query.date);
    return composeHome(query.date, {
      athleteSlugs: view.athletes().map((a) => a.slug),
      onThisDay: view.onThisDay(monthDayOfIso(query.date)),
      calendar: view.calendar(window.from, window.to),
      globe: view.globe(),
      greats: view.hallOfGreats(),
      sports: view.sportCards(),
    });
  }
}
