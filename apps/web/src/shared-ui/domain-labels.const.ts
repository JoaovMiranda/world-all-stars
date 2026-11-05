import type {
  AthleteStatus,
  CompetitionLevel,
  ContactTopic,
  OnThisDayKind,
  SourceUsageStatus,
  Tier,
} from '@was/shared';

// pt-BR labels of shared domain values, used by every module (ready to move to i18n namespaces).
export const TIER_LABEL: Record<Tier, string> = { mythic: 'Mítico', legendary: 'Lendário', elite: 'Elite', champion: 'Campeão' };
export const LEVEL_LABEL: Record<CompetitionLevel, string> = { world: 'Mundial', continental: 'Continental', national: 'Nacional', local: 'Local' };
export const MEDAL_LABEL = { gold: 'Ouro', silver: 'Prata', bronze: 'Bronze' } as const;
export const ON_THIS_DAY_KIND_LABEL: Record<OnThisDayKind, string> = {
  birth: 'Nascimento',
  death: 'Falecimento',
  title: 'Conquista',
  record: 'Recorde',
  career: 'Marco da carreira',
};
export const ATHLETE_STATUS_LABEL: Record<AthleteStatus, string> = { active: 'Em atividade', retired: 'Aposentado', deceased: 'Falecido' };
export const CONTACT_TOPIC_LABEL: Record<ContactTopic, string> = {
  data_error: 'Erro em um dado',
  press: 'Imprensa',
  privacy: 'Privacidade (LGPD)',
  partnership: 'Parcerias',
  other: 'Outro assunto',
};
export const SOURCE_USAGE_LABEL: Record<SourceUsageStatus, string> = {
  active: 'Em uso',
  pending_permission: 'Aguardando permissão',
  link_only: 'Só link',
  rejected: 'Descartada',
};
/** Roles of an organization in a sport (doc 19). Unknown roles fall back to the raw key. */
export const ORG_ROLE_LABEL: Record<string, string> = {
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
};
