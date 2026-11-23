import type { RegisteredMethodology } from './core/registered-methodology.interface';
import { bjjCareer, footballChampions } from './methodologies.const';

/** Registered methodologies by key (adding a sport = adding a methodology, never touching the engine). */
export const METHODOLOGIES: Readonly<Record<string, RegisteredMethodology>> = {
  [footballChampions.key]: footballChampions,
  [bjjCareer.key]: bjjCareer,
};
