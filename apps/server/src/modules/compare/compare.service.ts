import { composeHeadToHead, type HeadToHeadInput, type HeadToHeadResponse } from '@was/shared';

import { BaseService } from '../../core/base.service';
import { CatalogService } from '../catalog/catalog.service';
import { CrossSportService } from '../cross-sport/cross-sport.service';
import { RankingsService } from '../rankings/rankings.service';

/**
 * Compare / head-to-head (D04): reuses the readouts each page already serves — the catalog profile, the cross-sport
 * band (D07), the legacy level (D11) and the published ranking positions — and puts two competitors side by side.
 * Read-only; an unknown slug is a 404.
 */
export class CompareService extends BaseService {
  private async side(slug: string): Promise<HeadToHeadInput> {
    const view = await new CatalogService(this.ctx).view();
    const profile = this.notFound(view.profile(slug));
    const crossSport = new CrossSportService(this.ctx);
    const [band, legacy, rankings] = await Promise.all([
      crossSport.athleteBand(slug),
      crossSport.athleteLegacy(slug),
      new RankingsService(this.ctx).athleteRankings(slug),
    ]);
    return { profile, band, legacy, rankings: rankings.items };
  }

  async headToHead(a: string, b: string): Promise<HeadToHeadResponse> {
    const [left, right, published] = await Promise.all([this.side(a), this.side(b), new RankingsService(this.ctx).listPublished()]);
    return composeHeadToHead(left, right, new Map(published.items.map((s) => [s.id, s.sport])));
  }
}
