import { composeCompare, type PublicApi, pageOf } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { notFound } from '../../http/http-error.helper';
import { CatalogService } from '../catalog/catalog.service';

/** P2/P4 + analysis (doc 16): everything read from the catalog snapshot. */
export class AthletesController extends BaseController {
  private view() {
    return this.service(CatalogService).view();
  }

  async athletes({ query }: ContractInputOf<typeof PublicApi.athletes>) {
    const { page, ...filters } = query;
    return pageOf((await this.view()).athletes(filters), page);
  }

  async profile({ params }: ContractInputOf<typeof PublicApi.athleteProfile>) {
    const profile = (await this.view()).profile(params.slug);
    if (!profile) throw notFound();
    return profile;
  }

  async analysisDimensions() {
    return (await this.view()).analysis();
  }

  async compare({ query }: ContractInputOf<typeof PublicApi.compare>) {
    const view = await this.view();
    return composeCompare(query.slugs, view.athletes(), view.analysis());
  }
}
