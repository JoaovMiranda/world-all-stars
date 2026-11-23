import { type Messages, MYTHIC_MIN_EVIDENCES, TIER_PERCENTILE_THRESHOLD, COMPETITION_LEVEL_WEIGHT as w } from '@was/shared';
import type { DocumentContent } from '@/shared-ui/document-content.interface';
import type { ABOUT_TEXT } from './about.const';

export const ABOUT_TEXT_ES = {
  tiersCaption: 'Niveles de campeón: sello y definición',
  levelsHeaders: ['Nivel', 'Peso en el legacy score', 'Ejemplos'],
  levelsCaption: 'Niveles de campeonato y premio, con peso y ejemplos',
  actions: {
    hall: 'Ver el Hall of Greats',
    athletes: 'Ver todos los atletas',
    sources: 'De dónde vienen los datos',
    suggest: 'Sugerir un atleta',
  },
  tierDefinition: {
    mythic:
      'Cambió el deporte: redefinió la técnica, los récords, la popularidad o la forma en que se juega y se ve el deporte, y es una referencia histórica unánime. Entra en el Hall of Greats.',
    legendary:
      'Dominio prolongado y números históricos entre los más grandes de todos los tiempos, sin haber transformado el deporte (o con menos consenso al respecto).',
    elite: 'Varios títulos de nivel mundial o continental y un claro protagonismo en su generación.',
    champion: 'Cumple los criterios de inclusión del deporte (título relevante), sin dominio prolongado.',
  },
  levelExamples: {
    world: 'Copa Mundial de la FIFA, Juegos Olímpicos, Mundial de Natación, Mundial de Ajedrez, Major de CS, cinturones AMB/CMB/FIB/OMB, Balón de Oro',
    continental: 'Copa Libertadores, Eurocopa, Juegos Panamericanos, Europeo de Ajedrez, IEM regional',
    national: 'Brasileirão, Trofeo José Finkel, Campeonato Brasileño de Ajedrez, Gamers Club Liga Série A',
    local: 'Campeonatos estatales (Paulistão, Carioca), torneos municipales y regionales',
  },
} satisfies Messages<typeof ABOUT_TEXT>;

export const CRITERIA_DOC_ES: DocumentContent = {
  title: 'Cómo elegimos',
  eyebrow: 'Acerca de',
  lead: 'World All Stars no es una base de datos de todos los atletas: es un salón de la fama global. Mira quién entra, cómo se define el nivel de cada campeón y qué hace que alguien sea Mítico.',
  sections: [
    {
      id: 'grande-campeao',
      title: 'Qué es un gran campeón',
      blocks: [
        {
          kind: 'p',
          text: 'Un atleta entra en el sitio si cumple al menos un criterio de su deporte. Los criterios son públicos, versionados y ajustables por el equipo de curaduría. Quien no los cumple puede ser aprobado con una justificación registrada y visible.',
        },
        {
          kind: 'p',
          text: 'Los datos vienen siempre de las fuentes recopiladas, con el origen de cada campo. Nadie edita datos a mano: quien tiene cuenta vota el nivel y comenta.',
        },
      ],
    },
    {
      id: 'criterios',
      title: 'Criterios de inclusión por deporte',
      blocks: [
        {
          kind: 'table',
          caption: 'Criterios de inclusión de los deportes del lanzamiento',
          headers: ['Deporte', 'Entra quien cumpla al menos uno'],
          rows: [
            [
              'Fútbol',
              'Balón de Oro o FIFA The Best · campeón del mundo con premio individual en el Mundial (Balón de Oro del Mundial, máximo goleador) · top 10 de máximos goleadores históricos oficiales',
            ],
            [
              'Natación',
              '2 o más oros olímpicos individuales · plusmarquista mundial en una prueba olímpica durante 2 años o más · 5 o más títulos mundiales individuales',
            ],
            ['Ajedrez', 'Campeón del mundo (clásico, linaje histórico y FIDE) · n.º 1 del ranking FIDE durante 12 meses o más · campeona del mundo femenina'],
            ['Boxeo', 'Campeón indiscutido (todos los cinturones principales) · campeón lineal · miembro del International Boxing Hall of Fame'],
            ['Counter-Strike', 'Campeón de Major con premio MVP · 2 o más Majors · n.º 1 del ranking anual HLTV Top 20'],
          ],
        },
        {
          kind: 'notice',
          tone: 'info',
          text: 'Los demás deportes del sitio siguen la misma lógica; los criterios de cada uno se publican aquí a medida que el equipo de curaduría los aprueba.',
        },
      ],
    },
    {
      id: 'niveis',
      title: 'Niveles de campeón',
      blocks: [{ kind: 'p', text: 'Estar en el sitio ya significa ser campeón. El nivel mide el tamaño del legado dentro de su propio deporte.' }],
    },
    {
      id: 'como-atribui',
      title: 'Cómo se asigna el nivel',
      blocks: [
        {
          kind: 'list',
          ordered: true,
          items: [
            `Puntuación objetiva (legacy score): suma de los logros, ponderados por el nivel de la competición (mundial ${w.world}, continental ${w.continental}, nacional ${w.national}, local ${w.local}), la rareza, los años en la cima y los récords vigentes.`,
            'La puntuación se convierte en un percentil dentro del deporte, porque un título mundial en ajedrez no equivale a uno en fútbol.',
            `Sugerencia automática: percentil ${TIER_PERCENTILE_THRESHOLD.legendary} o más → candidato a Legendario; ${TIER_PERCENTILE_THRESHOLD.elite} o más → Élite; el resto → Campeón.`,
            'Mítico nunca es automático: exige el dossier «Cambió el juego» (ver abajo).',
            'Todo cambio de nivel queda versionado, con justificación pública e historial.',
          ],
        },
      ],
    },
    {
      id: 'mitico',
      title: 'Mítico y el Hall of Greats',
      blocks: [
        {
          kind: 'p',
          text: `Para ser Mítico, el atleta necesita un dossier con al menos ${MYTHIC_MIN_EVIDENCES} de las evidencias de abajo, revisado y aprobado por el equipo de curaduría (preferiblemente por dos administradores). Los Míticos forman el Hall of Greats.`,
        },
        {
          kind: 'list',
          items: [
            'Técnica, estilo o estrategia que lleva su nombre o que se convirtió en estándar.',
            'Récord que duró décadas o redefinió el límite del deporte.',
            'Cambio de regla, formato o mercado provocado por él.',
            'Popularización global del deporte o de una región.',
            'Reconocimiento institucional como el más grande de todos («premio del siglo», máximo honor de un salón de la fama).',
          ],
        },
      ],
    },
    {
      id: 'campeonatos',
      title: 'Nivel de campeonato y premio',
      blocks: [
        {
          kind: 'p',
          text: 'Toda competición y todo premio tienen un nivel, que se muestra en cada logro y se usa en los filtros. Los Juegos Olímpicos son de nivel mundial; los premios usan la misma escala.',
        },
      ],
    },
    {
      id: 'comunidade',
      title: 'El voto de la comunidad',
      blocks: [
        {
          kind: 'p',
          text: 'Quien tiene cuenta vota el nivel que considera justo para cada atleta (un voto por atleta, que se puede cambiar). Cuando la mayoría no está de acuerdo con el nivel oficial, el equipo de curaduría recibe una señal para revisar el caso. Siempre decide el equipo de curaduría, con justificación.',
        },
      ],
    },
  ],
};
