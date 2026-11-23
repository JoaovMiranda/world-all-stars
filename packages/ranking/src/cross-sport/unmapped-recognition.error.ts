import type { CrossSportItem } from './cross-sport-item.interface';

/** A competitive fact without a mapping is a review item, never a guess (D07). */
export class UnmappedRecognitionError extends Error {
  constructor(readonly item: CrossSportItem) {
    super(`No cross-sport mapping for ${item.sport}/${item.kind}/${item.value} (evidence ${item.evidenceId})`);
    this.name = 'UnmappedRecognitionError';
  }
}
