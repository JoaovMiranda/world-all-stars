import type { Snak } from './wikidata-snak.type';

/** The part of a Wikidata entity the `wikidata-profile` provider reads (labels, descriptions, claims). */
export interface WdEntity {
  id: string;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<string, Snak[]>;
}
