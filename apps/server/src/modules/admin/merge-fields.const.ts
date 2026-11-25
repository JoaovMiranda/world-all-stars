/**
 * Athlete columns shown side by side in the merge preview; the admin picks the winner of each one (D14). The Wikidata QID
 * is not a column choice: it lives in `entity_external_ids`, which the merge re-points.
 */
export const MERGE_FIELDS = [
  'knownAs',
  'fullName',
  'slug',
  'gender',
  'birthDate',
  'birthYear',
  'deathDate',
  'deathYear',
  'heightCm',
  'dominantHand',
  'dominantFoot',
  'careerStartYear',
  'careerEndYear',
] as const;
