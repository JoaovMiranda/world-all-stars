/** Entity kinds of the registry (handoff v3 §4.1): FK target of aliases, external ids, provenance, merges, redirects. */
export const EntityType = {
  Competitor: 'competitor',
  Organization: 'organization',
  Sport: 'sport',
  Competition: 'competition',
  CompetitionEdition: 'competition_edition',
  CompetitionEvent: 'competition_event',
  RecognitionDefinition: 'recognition_definition',
  RepresentationEntity: 'representation_entity',
  Ruleset: 'ruleset',
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];
export const ENTITY_TYPE_VALUES = Object.values(EntityType) as [EntityType, ...EntityType[]];
