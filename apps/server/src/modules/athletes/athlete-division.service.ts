import { active, categoryDimensions, categorySetValues, categoryValues, categoryValueTranslations, recognitionGrants } from '@was/db';
import type { DivisionClass } from '@was/shared';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';

import { BaseService } from '../../core/base.service';

/**
 * Division classes of recognition grants (BJJ belt, gi/no-gi, weight, absolute, sex, age): the category set values the
 * grant was earned in, labelled in the request language (falling back to the organization's original label).
 */
export class AthleteDivisionService extends BaseService {
  async classesOf(grantIds: string[]): Promise<Map<string, DivisionClass[]>> {
    const byGrant = new Map<string, DivisionClass[]>();
    if (!grantIds.length) return byGrant;
    const found = await this.db
      .select({
        grantId: recognitionGrants.id,
        dimension: categoryDimensions.slug,
        value: categoryValues.slug,
        original: categoryValues.originalLabel,
        translated: categoryValueTranslations.name,
      })
      .from(recognitionGrants)
      .innerJoin(categorySetValues, and(eq(categorySetValues.setId, recognitionGrants.categorySetId), isNull(categorySetValues.deletedAt)))
      .innerJoin(categoryValues, and(eq(categoryValues.id, categorySetValues.valueId), isNull(categoryValues.deletedAt)))
      .innerJoin(categoryDimensions, eq(categoryDimensions.id, categoryValues.dimensionId))
      .leftJoin(
        categoryValueTranslations,
        and(
          eq(categoryValueTranslations.valueId, categoryValues.id),
          eq(categoryValueTranslations.locale, this.ctx.locale),
          isNull(categoryValueTranslations.deletedAt),
        ),
      )
      .where(active(recognitionGrants, inArray(recognitionGrants.id, grantIds)))
      .orderBy(asc(categoryDimensions.slug), asc(categoryValues.sortOrder));
    for (const r of found) {
      const list = byGrant.get(r.grantId) ?? [];
      list.push({ dimension: r.dimension, value: r.value, label: r.translated ?? r.original });
      byGrant.set(r.grantId, list);
    }
    return byGrant;
  }
}
