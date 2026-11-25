import { AchievementKind, type AthleteProfile, composeCompare, type PublicApi, pageOf } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { notFound } from '../../http/http-error.helper';
import { CatalogService } from '../catalog/catalog.service';
import { InteractionsService } from '../interactions/interactions.service';
import { AthleteDivisionService } from './athlete-division.service';

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
    // Public star/heart counts only (D03): read live, never the visitor's own state (that one is client-side).
    const [withClasses, interactions] = await Promise.all([this.withDivisionClasses(profile), this.service(InteractionsService).publicCountsOf(profile.id)]);
    return interactions ? { ...withClasses, interactions } : withClasses;
  }

  /** Adds the division classes (belt, gi/no-gi, weight…) to the competition results that have them (additive field). */
  private async withDivisionClasses(profile: AthleteProfile): Promise<AthleteProfile> {
    const ids = profile.achievements.filter((a) => a.kind === AchievementKind.Competition).map((a) => a.id);
    const classes = await this.service(AthleteDivisionService).classesOf(ids);
    if (!classes.size) return profile;
    return {
      ...profile,
      achievements: profile.achievements.map((a) => {
        const found = a.kind === AchievementKind.Competition ? classes.get(a.id) : undefined;
        return found ? { ...a, classes: found } : a;
      }),
    };
  }

  async analysisDimensions() {
    return (await this.view()).analysis();
  }

  async compare({ query }: ContractInputOf<typeof PublicApi.compare>) {
    const view = await this.view();
    return composeCompare(query.slugs, view.athletes(), view.analysis());
  }
}
