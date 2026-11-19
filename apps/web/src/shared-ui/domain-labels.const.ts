import { type AthleteStatus, type CompetitionLevel, type ContactTopic, defineMessages, type OnThisDayKind, type SourceUsageStatus, type Tier } from '@was/shared';

import { DOMAIN_LABELS_TEXT_EN } from './domain-labels.const.en';
import { DOMAIN_LABELS_TEXT_ES } from './domain-labels.const.es';

// pt-BR labels of shared domain values, used by every module (en/es next to it).
export const DOMAIN_LABELS_TEXT: {
  tier: Record<Tier, string>;
  level: Record<CompetitionLevel, string>;
  medal: { gold: string; silver: string; bronze: string };
  onThisDayKind: Record<OnThisDayKind, string>;
  athleteStatus: Record<AthleteStatus, string>;
  contactTopic: Record<ContactTopic, string>;
  sourceUsage: Record<SourceUsageStatus, string>;
  /** Roles of an organization in a sport (doc 19). Unknown roles fall back to the raw key. */
  orgRole: Record<string, string>;
} = {
  tier: { mythic: 'Mítico', legendary: 'Lendário', elite: 'Elite', champion: 'Campeão' },
  level: { world: 'Mundial', continental: 'Continental', national: 'Nacional', local: 'Local' },
  medal: { gold: 'Ouro', silver: 'Prata', bronze: 'Bronze' },
  onThisDayKind: {
    birth: 'Nascimento',
    death: 'Falecimento',
    title: 'Conquista',
    record: 'Recorde',
    career: 'Marco da carreira',
  },
  athleteStatus: { active: 'Em atividade', retired: 'Aposentado', deceased: 'Falecido', unknown: 'Situação não informada' },
  contactTopic: {
    data_error: 'Erro em um dado',
    press: 'Imprensa',
    privacy: 'Privacidade (LGPD)',
    partnership: 'Parcerias',
    other: 'Outro assunto',
  },
  sourceUsage: {
    active: 'Em uso',
    pending_permission: 'Aguardando permissão',
    link_only: 'Só link',
    rejected: 'Descartada',
  },
  orgRole: {
    world_federation: 'Federação internacional',
    confederation: 'Confederação',
    national_federation: 'Federação nacional',
    regional_federation: 'Federação regional',
    circuit: 'Circuito',
    private_circuit: 'Circuito privado',
    sanctioning_body: 'Entidade de cinturão',
    promoter: 'Promotora/liga privada',
    amateur_federation: 'Federação amadora',
    league: 'Liga',
    amateur_league: 'Liga amadora',
    stadium: 'Estádio',
    publisher: 'Dona do jogo',
    organizer: 'Organiza competições',
    award: 'Concede prêmios',
    brand_owner: 'Marca dona do formato',
    cultural_body: 'Entidade cultural',
  },
};

export const DOMAIN_LABELS_MESSAGES = defineMessages(DOMAIN_LABELS_TEXT, { en: DOMAIN_LABELS_TEXT_EN, es: DOMAIN_LABELS_TEXT_ES });
