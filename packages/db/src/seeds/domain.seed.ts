// Initial domain vocabularies (handoff v3 §4.9): seeded data, extensible by seed/admin without migrations.
// Each value: slug, then [en, pt-BR, es] names. Sport-scoped values (positions, roles) carry the sport slug.
import { DomainKind } from '@was/shared';

import { seedId } from '../helpers/seed-id.helper';
import { upsertRow } from '../helpers/upsert.helper';
import { domainValues, domainValueTranslations } from '../tables/domain.table';
import type { Database } from '../types/database.type';
import type { DomainVocabularyValue } from '../types/domain-vocabulary.type';

const V = (slug: string, en: string, pt: string, es: string, attributes?: Record<string, unknown>): DomainVocabularyValue => [slug, [en, pt, es], attributes];

export const DOMAIN_VOCABULARY: Partial<Record<DomainKind, readonly DomainVocabularyValue[]>> = {
  [DomainKind.TaxonLevel]: [
    V('sport', 'Sport', 'Esporte', 'Deporte'),
    V('discipline', 'Discipline', 'Disciplina', 'Disciplina'),
    V('variant', 'Variant', 'Variante', 'Variante'),
    V('style', 'Style', 'Estilo', 'Estilo'),
  ],
  [DomainKind.SportRelation]: [
    V('discipline_of', 'Discipline of', 'Disciplina de', 'Disciplina de'),
    V('variant_of', 'Variant of', 'Variante de', 'Variante de'),
    V('style_of', 'Style of', 'Estilo de', 'Estilo de'),
    V('derived_from', 'Derived from', 'Derivado de', 'Derivado de'),
    V('related_to', 'Related to', 'Relacionado a', 'Relacionado con'),
    V('adapted_from', 'Adapted from', 'Adaptado de', 'Adaptado de'),
  ],
  [DomainKind.ClassificationScheme]: [
    V('tradition_status', 'Tradition status', 'Status de tradição', 'Estado de tradición'),
    V('olympic_status', 'Olympic status', 'Status olímpico', 'Estado olímpico'),
    V('paralympic_status', 'Paralympic status', 'Status paralímpico', 'Estado paralímpico'),
    V('recognition', 'Recognition', 'Reconhecimento', 'Reconocimiento'),
  ],
  [DomainKind.EditionKind]: [
    V('edition', 'Edition', 'Edição', 'Edición'),
    V('season', 'Season', 'Temporada', 'Temporada'),
    V('cycle', 'Cycle', 'Ciclo', 'Ciclo'),
    V('single_event', 'Single event', 'Evento único', 'Evento único'),
    V('series', 'Series', 'Série', 'Serie'),
  ],
  [DomainKind.StageKind]: [
    V('phase', 'Phase', 'Fase', 'Fase'),
    V('round', 'Round', 'Rodada', 'Ronda'),
    V('leg', 'Leg', 'Etapa', 'Etapa'),
    V('heat', 'Heat', 'Bateria', 'Serie'),
    V('group', 'Group', 'Grupo', 'Grupo'),
    V('stage', 'Stage', 'Etapa', 'Etapa'),
    V('day', 'Day', 'Dia', 'Día'),
    V('final', 'Final', 'Final', 'Final'),
  ],
  [DomainKind.CompetitionFormat]: [
    V('race_measured', 'Measured race', 'Prova medida', 'Prueba medida', { hasContests: false }),
    V('head_to_head', 'Head-to-head', 'Confronto direto', 'Enfrentamiento directo', { hasContests: true }),
    V('league', 'League', 'Liga', 'Liga', { hasContests: true }),
    V('knockout', 'Knockout tournament', 'Mata-mata', 'Eliminación directa', { hasContests: true }),
    V('group_and_knockout', 'Groups and knockout', 'Grupos e mata-mata', 'Grupos y eliminación', { hasContests: true }),
    V('circuit', 'Circuit', 'Circuito', 'Circuito', { hasContests: false }),
    V('judged', 'Judged', 'Julgamento', 'Juzgado', { hasContests: false }),
    V('challenge', 'Challenge', 'Desafio', 'Desafío', { hasContests: false }),
    V('record_attempt', 'Record attempt', 'Tentativa de recorde', 'Intento de récord', { hasContests: false }),
    V('swiss', 'Swiss system', 'Sistema suíço', 'Sistema suizo', { hasContests: true }),
    V('match_series', 'Match series', 'Série de partidas', 'Serie de partidas', { hasContests: true }),
    V('traditional', 'Traditional (local rules)', 'Tradicional (regras locais)', 'Tradicional (reglas locales)', { hasContests: false }),
  ],
  [DomainKind.EntryComposition]: [
    V('individual', 'Individual', 'Individual', 'Individual', { minMembers: 1, maxMembers: 1 }),
    V('team', 'Team', 'Equipe', 'Equipo', { minMembers: 2 }),
    V('pair', 'Pair', 'Dupla', 'Pareja', { minMembers: 2, maxMembers: 2 }),
    V('relay', 'Relay', 'Revezamento', 'Relevo', { minMembers: 2 }),
    V('crew', 'Crew', 'Tripulação', 'Tripulación', { minMembers: 2 }),
    V('team_of_individuals', 'Team of individuals', 'Equipe de individuais', 'Equipo de individuales', { minMembers: 2 }),
  ],
  [DomainKind.ParticipationRole]: [
    V('starter', 'Starter', 'Titular', 'Titular'),
    V('substitute', 'Substitute', 'Reserva que entrou', 'Suplente que entró'),
    V('unused_substitute', 'Unused substitute', 'Reserva não utilizado', 'Suplente sin jugar'),
    V('reserve', 'Reserve', 'Reserva', 'Reserva'),
    V('captain', 'Captain', 'Capitão', 'Capitán'),
    V('leg_1', 'Leg 1', 'Perna 1', 'Posta 1'),
    V('leg_2', 'Leg 2', 'Perna 2', 'Posta 2'),
    V('leg_3', 'Leg 3', 'Perna 3', 'Posta 3'),
    V('leg_4', 'Leg 4', 'Perna 4', 'Posta 4'),
    V('heat_only', 'Heats only', 'Só nas eliminatórias', 'Solo en las series'),
    V('competitor', 'Competitor', 'Competidor', 'Competidor'),
  ],
  [DomainKind.MembershipRole]: [
    V('player', 'Player', 'Jogador', 'Jugador'),
    V('athlete', 'Athlete', 'Atleta', 'Atleta'),
    V('member', 'Member', 'Membro', 'Miembro'),
    V('coach', 'Coach', 'Técnico', 'Entrenador'),
    V('captain', 'Captain', 'Capitão', 'Capitán'),
  ],
  [DomainKind.OrganizationRole]: [
    V('world_federation', 'World federation', 'Federação mundial', 'Federación mundial'),
    V('governing_body', 'Governing body', 'Entidade reguladora', 'Organismo rector'),
    V('sanctioning_body', 'Sanctioning body', 'Entidade de cinturão', 'Organismo sancionador'),
    V('organizer', 'Organizer', 'Organizador', 'Organizador'),
    V('record_keeper', 'Record keeper', 'Guardião de registros', 'Custodio de registros'),
    V('community_authority', 'Community authority', 'Autoridade comunitária', 'Autoridad comunitaria'),
    V('publisher', 'Publisher', 'Dona do jogo', 'Editora'),
    V('ratifier', 'Ratifier', 'Homologador', 'Homologador'),
    V('promoter', 'Promoter', 'Promotora', 'Promotora'),
    V('league', 'League', 'Liga', 'Liga'),
    V('national_federation', 'National federation', 'Federação nacional', 'Federación nacional'),
    V('confederation', 'Confederation', 'Confederação', 'Confederación'),
    V('regional_federation', 'Regional federation', 'Federação regional', 'Federación regional'),
    V('amateur_federation', 'Amateur federation', 'Federação amadora', 'Federación amateur'),
    V('amateur_league', 'Amateur league', 'Liga amadora', 'Liga amateur'),
    V('circuit', 'Circuit', 'Circuito', 'Circuito'),
    V('private_circuit', 'Private circuit', 'Circuito privado', 'Circuito privado'),
    V('brand_owner', 'Brand owner', 'Dona da marca', 'Dueña de la marca'),
    V('stadium', 'Stadium', 'Estádio', 'Estadio'),
    V('cultural_body', 'Cultural body', 'Entidade cultural', 'Entidad cultural'),
  ],
  [DomainKind.EntryStatus]: [
    V('registered', 'Registered', 'Inscrito', 'Inscrito'),
    V('replacement', 'Replacement', 'Substituto', 'Sustituto'),
    V('withdrawn', 'Withdrawn', 'Desistente', 'Retirado'),
    V('rejected', 'Rejected', 'Rejeitado', 'Rechazado'),
    V('dns', 'Did not start', 'Não largou', 'No tomó la salida'),
  ],
  [DomainKind.Appearance]: [
    V('appeared', 'Appeared', 'Entrou em campo', 'Jugó'),
    V('did_not_appear', 'Did not appear', 'Não entrou', 'No jugó'),
    V('unknown', 'Unknown', 'Desconhecido', 'Desconocido'),
  ],
  [DomainKind.ResultStatus]: [
    V('finished', 'Finished', 'Concluiu', 'Terminó'),
    V('won', 'Won', 'Venceu', 'Ganó'),
    V('lost', 'Lost', 'Perdeu', 'Perdió'),
    V('drawn', 'Drawn', 'Empatou', 'Empató'),
    V('dnf', 'Did not finish', 'Não concluiu', 'No terminó'),
    V('dns', 'Did not start', 'Não largou', 'No tomó la salida'),
    V('dq', 'Disqualified', 'Desclassificado', 'Descalificado'),
    V('recognized', 'Recognized', 'Reconhecido', 'Reconocido'),
  ],
  [DomainKind.ContestOutcome]: [
    V('win', 'Win', 'Vitória', 'Victoria'),
    V('loss', 'Loss', 'Derrota', 'Derrota'),
    V('draw', 'Draw', 'Empate', 'Empate'),
    V('no_contest', 'No contest', 'Sem resultado', 'Sin resultado'),
  ],
  [DomainKind.ClassificationKind]: [
    V('league_table', 'League table', 'Tabela de classificação', 'Tabla de posiciones'),
    V('circuit_standings', 'Circuit standings', 'Classificação do circuito', 'Clasificación del circuito'),
    V('overall', 'Overall', 'Geral', 'General'),
    V('team_ranking', 'Team ranking', 'Classificação por equipes', 'Clasificación por equipos'),
  ],
  [DomainKind.RecognitionKind]: [
    V('championship_title', 'Championship title', 'Título de campeão', 'Título de campeón'),
    V('medal', 'Medal', 'Medalha', 'Medalla'),
    V('belt_title', 'Belt title', 'Cinturão', 'Cinturón'),
    V('award', 'Award', 'Prêmio', 'Premio'),
    V('record', 'Record', 'Recorde', 'Récord'),
    V('hall_of_fame', 'Hall of fame', 'Hall da fama', 'Salón de la fama'),
    V('ranking_honor', 'Ranking honour', 'Honraria de ranking', 'Honor de ranking'),
    V('traditional_honor', 'Traditional honour', 'Honraria tradicional', 'Honor tradicional'),
    V('runner_up', 'Runner-up', 'Vice-campeão', 'Subcampeón'),
  ],
  [DomainKind.RecognitionLevel]: [
    V('gold', 'Gold', 'Ouro', 'Oro'),
    V('silver', 'Silver', 'Prata', 'Plata'),
    V('bronze', 'Bronze', 'Bronze', 'Bronce'),
    V('winner', 'Winner', 'Vencedor', 'Ganador'),
    V('runner_up', 'Runner-up', 'Vice', 'Subcampeón'),
  ],
  [DomainKind.GrantStatus]: [
    V('granted', 'Granted', 'Concedido', 'Concedido'),
    V('revoked', 'Revoked', 'Revogado', 'Revocado'),
    V('retroactive', 'Retroactive', 'Retroativo', 'Retroactivo'),
    V('vacated', 'Vacated', 'Vago', 'Vacante'),
    V('stripped', 'Stripped', 'Cassado', 'Despojado'),
  ],
  [DomainKind.TitleEndReason]: [
    V('lost', 'Lost', 'Perdeu', 'Perdió'),
    V('vacated', 'Vacated', 'Deixou vago', 'Dejó vacante'),
    V('stripped', 'Stripped', 'Destituído', 'Despojado'),
    V('retired', 'Retired', 'Aposentou-se', 'Se retiró'),
    V('abdicated', 'Abdicated', 'Abdicou', 'Abdicó'),
    V('unknown', 'Unknown', 'Desconhecido', 'Desconocido'),
  ],
  [DomainKind.RatificationStatus]: [
    V('ratified', 'Ratified', 'Homologado', 'Homologado'),
    V('pending', 'Pending', 'Pendente', 'Pendiente'),
    V('rejected', 'Rejected', 'Rejeitado', 'Rechazado'),
    V('superseded', 'Superseded', 'Superado', 'Superado'),
  ],
  [DomainKind.InclusionStatus]: [
    V('current', 'Current programme', 'Programa atual', 'Programa actual'),
    V('discontinued', 'Discontinued', 'Descontinuado', 'Discontinuado'),
    V('demonstration', 'Demonstration', 'Demonstração', 'Demostración'),
    V('confirmed_future', 'Confirmed for a future edition', 'Confirmado para edição futura', 'Confirmado para una edición futura'),
    V('core', 'Core sport', 'Esporte obrigatório', 'Deporte obligatorio'),
    V('optional', 'Optional sport', 'Esporte opcional', 'Deporte opcional'),
    V('recognized', 'Recognized sport', 'Esporte reconhecido', 'Deporte reconocido'),
    V('youth_only', 'Youth Games only', 'Só nos Jogos da Juventude', 'Solo en los Juegos de la Juventud'),
  ],
  [DomainKind.NameKind]: [
    V('official', 'Official name', 'Nome oficial', 'Nombre oficial'),
    V('international', 'International name', 'Nome internacional', 'Nombre internacional'),
    V('original', 'Original name', 'Nome original', 'Nombre original'),
    V('display', 'Display name', 'Nome de exibição', 'Nombre visible'),
    V('nickname', 'Nickname', 'Apelido', 'Apodo'),
    V('birth', 'Birth name', 'Nome de nascimento', 'Nombre de nacimiento'),
    V('married', 'Married name', 'Nome de casada', 'Nombre de casada'),
    V('transliteration', 'Transliteration', 'Transliteração', 'Transliteración'),
    V('former', 'Former name', 'Nome anterior', 'Nombre anterior'),
    V('self_designation', 'Self-designation', 'Autodenominação', 'Autodenominación'),
  ],
  [DomainKind.RepresentationContext]: [
    V('citizenship', 'Citizenship', 'Cidadania', 'Ciudadanía'),
    V('sporting_representation', 'Sporting representation', 'Representação esportiva', 'Representación deportiva'),
    V('birth', 'Birth', 'Nascimento', 'Nacimiento'),
    V('community_affiliation', 'Community affiliation', 'Pertencimento comunitário', 'Pertenencia comunitaria'),
    V('club_affiliation', 'Club affiliation', 'Clube', 'Club'),
  ],
  [DomainKind.CommunityKind]: [
    V('indigenous_people', 'Indigenous people', 'Povo indígena', 'Pueblo indígena'),
    V('nation', 'Nation', 'Nação', 'Nación'),
    V('region', 'Region', 'Região', 'Región'),
    V('community', 'Community', 'Comunidade', 'Comunidad'),
    V('village', 'Village', 'Aldeia', 'Aldea'),
  ],
  [DomainKind.EntityRelation]: [
    V('successor_of', 'Successor of', 'Sucessor de', 'Sucesor de'),
    V('part_of', 'Part of', 'Parte de', 'Parte de'),
    V('split_into', 'Split into', 'Dividiu-se em', 'Se dividió en'),
    V('merged_into', 'Merged into', 'Fundiu-se em', 'Se fusionó en'),
    V('succeeded_in_sport_by', 'Succeeded in sport by', 'Sucedido no esporte por', 'Sucedido en el deporte por'),
    V('origin_of', 'Origin of', 'Origem de', 'Origen de'),
    V('succeeded_by', 'Succeeded by', 'Sucedido por', 'Sucedido por'),
  ],
  [DomainKind.Certainty]: [
    V('documented_official', 'Official document', 'Documento oficial', 'Documento oficial'),
    V('documented_secondary', 'Secondary source', 'Fonte secundária', 'Fuente secundaria'),
    V('community_attested', 'Attested by the community', 'Atestado pela comunidade', 'Atestiguado por la comunidad'),
    V('oral_tradition_recorded', 'Recorded oral tradition', 'Tradição oral registrada', 'Tradición oral registrada'),
    V('disputed', 'Disputed', 'Contestado', 'Disputado'),
  ],
  [DomainKind.EvidenceType]: [
    V('official_publication', 'Official publication', 'Publicação oficial', 'Publicación oficial'),
    V('database', 'Database', 'Base de dados', 'Base de datos'),
    V('encyclopedia', 'Encyclopedia', 'Enciclopédia', 'Enciclopedia'),
    V('press', 'Press', 'Imprensa', 'Prensa'),
    V('community_record', 'Community record', 'Registro comunitário', 'Registro comunitario'),
    V('oral_tradition_recorded', 'Recorded oral tradition', 'Tradição oral registrada', 'Tradición oral registrada'),
  ],
  [DomainKind.GroupKind]: [
    V('pair', 'Pair', 'Dupla', 'Pareja'),
    V('trio', 'Trio', 'Trio', 'Trío'),
    V('crew', 'Crew', 'Tripulação', 'Tripulación'),
    V('relay_team', 'Relay team', 'Equipe de revezamento', 'Equipo de relevos'),
    V('roster', 'Roster', 'Elenco', 'Plantel'),
  ],
  [DomainKind.CategoryRelation]: [
    V('equivalent', 'Equivalent', 'Equivalente', 'Equivalente'),
    V('approximately', 'Approximately', 'Aproximado', 'Aproximado'),
    V('contains', 'Contains', 'Contém', 'Contiene'),
    V('contained_in', 'Contained in', 'Contido em', 'Contenido en'),
  ],
  [DomainKind.StatPeriod]: [
    V('career', 'Career', 'Carreira', 'Carrera'),
    V('season', 'Season', 'Temporada', 'Temporada'),
    V('tournament', 'Tournament', 'Torneio', 'Torneo'),
  ],
};

const LOCALES = ['en', 'pt-BR', 'es'] as const;

/** Upserts every vocabulary value (+ translations). Idempotent; returns the number of values. */
export const seedDomainVocabulary = async (db: Database): Promise<number> => {
  let n = 0;
  for (const [domain, values] of Object.entries(DOMAIN_VOCABULARY)) {
    for (const [i, [slug, names, attributes]] of (values ?? []).entries()) {
      const id = await upsertRow(db, domainValues, {
        id: seedId('domain', domain, slug),
        createdVia: 'seed',
        domain,
        slug,
        sortOrder: i,
        attributes: attributes ?? {},
      });
      for (const [j, locale] of LOCALES.entries()) {
        await upsertRow(db, domainValueTranslations, {
          id: seedId('domain_tr', domain, slug, locale),
          createdVia: 'seed',
          valueId: id,
          locale,
          name: names[j]!,
        });
      }
      n++;
    }
  }
  return n;
};
