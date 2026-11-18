import type { Messages } from '@was/shared';

import type { DOMAIN_LABELS_TEXT } from './domain-labels.const';

export const DOMAIN_LABELS_TEXT_EN = {
  tier: { mythic: 'Mythic', legendary: 'Legendary', elite: 'Elite', champion: 'Champion' },
  level: { world: 'World', continental: 'Continental', national: 'National', local: 'Local' },
  medal: { gold: 'Gold', silver: 'Silver', bronze: 'Bronze' },
  onThisDayKind: {
    birth: 'Birth',
    death: 'Death',
    title: 'Title',
    record: 'Record',
    career: 'Career milestone',
  },
  athleteStatus: { active: 'Active', retired: 'Retired', deceased: 'Deceased' },
  contactTopic: {
    data_error: 'Error in the data',
    press: 'Press',
    privacy: 'Privacy (LGPD)',
    partnership: 'Partnerships',
    other: 'Something else',
  },
  sourceUsage: {
    active: 'In use',
    pending_permission: 'Awaiting permission',
    link_only: 'Link only',
    rejected: 'Discarded',
  },
  orgRole: {
    world_federation: 'International federation',
    confederation: 'Confederation',
    national_federation: 'National federation',
    regional_federation: 'Regional federation',
    circuit: 'Circuit',
    private_circuit: 'Private circuit',
    sanctioning_body: 'Sanctioning body',
    promoter: 'Promoter / private league',
    amateur_federation: 'Amateur federation',
    league: 'League',
    amateur_league: 'Amateur league',
    stadium: 'Stadium',
    publisher: 'Game publisher',
    organizer: 'Organizes competitions',
    award: 'Grants awards',
    brand_owner: 'Brand that owns the format',
    cultural_body: 'Cultural body',
  },
} satisfies Messages<typeof DOMAIN_LABELS_TEXT>;
