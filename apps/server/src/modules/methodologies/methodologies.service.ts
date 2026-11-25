import { METHODOLOGIES } from '@was/ranking';
import type { MethodologyDocResponse } from '@was/shared';

import { BaseService } from '../../core/base.service';
import { METHODOLOGY_DOCS } from './methodology-docs.const';

/** Public methodology pages (T4.2): registry metadata + the parsed METHODOLOGY.md in the request language. */
export class MethodologiesService extends BaseService {
  doc(key: string): MethodologyDocResponse {
    const methodology = this.notFound(Object.hasOwn(METHODOLOGIES, key) ? METHODOLOGIES[key] : null);
    const found = this.notFound(METHODOLOGY_DOCS.get(key, this.ctx.locale));
    return {
      key: methodology.key,
      version: methodology.version,
      sport: methodology.sport,
      rankings: methodology.rankingDefinitions().map((r) => ({ key: r.key, title: r.title })),
      title: found.document.title ?? methodology.key,
      blocks: found.document.blocks,
      contentLocale: found.locale,
    };
  }
}
