import type { Messages } from '@was/shared';

import type { DOMAIN_LABELS_TEXT } from './domain-labels.const';

export const DOMAIN_LABELS_TEXT_ES = {
  tier: { mythic: 'Mítico', legendary: 'Legendario', elite: 'Élite', champion: 'Campeón' },
  level: { world: 'Mundial', continental: 'Continental', national: 'Nacional', local: 'Local' },
  medal: { gold: 'Oro', silver: 'Plata', bronze: 'Bronce' },
  onThisDayKind: {
    birth: 'Nacimiento',
    death: 'Fallecimiento',
    title: 'Título',
    record: 'Récord',
    career: 'Hito de la carrera',
  },
  athleteStatus: { active: 'En activo', retired: 'Retirado', deceased: 'Fallecido', unknown: 'Situación no informada' },
  contactTopic: {
    data_error: 'Error en un dato',
    press: 'Prensa',
    privacy: 'Privacidad (LGPD)',
    partnership: 'Colaboraciones',
    other: 'Otro asunto',
  },
  sourceUsage: {
    active: 'En uso',
    pending_permission: 'Esperando permiso',
    link_only: 'Solo enlace',
    rejected: 'Descartada',
  },
  orgRole: {
    world_federation: 'Federación internacional',
    confederation: 'Confederación',
    national_federation: 'Federación nacional',
    regional_federation: 'Federación regional',
    circuit: 'Circuito',
    private_circuit: 'Circuito privado',
    sanctioning_body: 'Organismo de cinturones',
    promoter: 'Promotora / liga privada',
    amateur_federation: 'Federación amateur',
    league: 'Liga',
    amateur_league: 'Liga amateur',
    stadium: 'Estadio',
    publisher: 'Dueña del juego',
    organizer: 'Organiza competiciones',
    award: 'Otorga premios',
    brand_owner: 'Marca dueña del formato',
    cultural_body: 'Entidad cultural',
  },
} satisfies Messages<typeof DOMAIN_LABELS_TEXT>;
