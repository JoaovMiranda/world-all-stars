/** Kind of information a source can be authoritative for (§5.2). */
export const InformationKind = {
  Identity: 'identity',
  Name: 'name',
  Biography: 'biography',
  Birth: 'birth',
  Representation: 'representation',
  SportTaxonomy: 'sport_taxonomy',
  SportRules: 'sport_rules',
  Ruleset: 'ruleset',
  CompetitionStructure: 'competition_structure',
  Entry: 'entry',
  Participation: 'participation',
  Lineup: 'lineup',
  Result: 'result',
  Classification: 'classification',
  Recognition: 'recognition',
  Record: 'record',
  TitleHolding: 'title_holding',
  Organization: 'organization',
  Category: 'category',
  Image: 'image',
  ExternalId: 'external_id',
  SportContent: 'sport_content',
} as const;
export type InformationKind = (typeof InformationKind)[keyof typeof InformationKind];
export const INFORMATION_KIND_VALUES = Object.values(InformationKind) as [InformationKind, ...InformationKind[]];
