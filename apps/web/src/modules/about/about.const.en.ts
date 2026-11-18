import { COMPETITION_LEVEL_WEIGHT as w, type Messages, MYTHIC_MIN_EVIDENCES, TIER_PERCENTILE_THRESHOLD } from '@was/shared';

import type { DocumentContent } from '@/shared-ui/document-page-layout.component';

import type { ABOUT_TEXT } from './about.const';

export const ABOUT_TEXT_EN = {
  tiersCaption: 'Champion tiers: badge and definition',
  levelsHeaders: ['Level', 'Weight in the legacy score', 'Examples'],
  levelsCaption: 'Championship and award levels, with weight and examples',
  actions: {
    hall: 'See the Hall of Greats',
    athletes: 'See all athletes',
    sources: 'Where the data comes from',
    suggest: 'Suggest an athlete',
  },
  tierDefinition: {
    mythic:
      'Changed the sport: redefined technique, records, popularity or the way the sport is played and watched, and is a unanimous historical reference. Enters the Hall of Greats.',
    legendary: 'Long dominance and historic numbers among the greatest of all time, without having transformed the sport (or with less consensus about it).',
    elite: 'Several world or continental titles and a clear standout of their generation.',
    champion: 'Meets the sport’s inclusion criteria (a relevant title), without long dominance.',
  },
  levelExamples: {
    world: 'FIFA World Cup, Olympic Games, World Aquatics Championships, World Chess Championship, CS Major, WBA/WBC/IBF/WBO belts, Ballon d’Or',
    continental: 'Copa Libertadores, UEFA European Championship, Pan American Games, European Chess Championship, regional IEM',
    national: 'Brazilian Série A, José Finkel Trophy, Brazilian Chess Championship, Gamers Club Liga Série A',
    local: 'State championships (Paulistão, Carioca), municipal and regional tournaments',
  },
} satisfies Messages<typeof ABOUT_TEXT>;

export const CRITERIA_DOC_EN: DocumentContent = {
  title: 'How we choose',
  eyebrow: 'About',
  lead: 'World All Stars isn’t a database of every athlete: it’s a global hall of fame. See who gets in, how each champion’s tier is set and what makes someone Mythic.',
  sections: [
    {
      id: 'grande-campeao',
      title: 'What a great champion is',
      blocks: [
        {
          kind: 'p',
          text: 'An athlete joins the site if they meet at least one criterion of their sport. The criteria are public, versioned and adjustable by the curators. Someone who doesn’t meet them can be approved with a recorded, visible justification.',
        },
        {
          kind: 'p',
          text: 'Data always comes from the collected sources, with the origin of every field. Nobody edits data by hand: account holders vote on the tier and comment.',
        },
      ],
    },
    {
      id: 'criterios',
      title: 'Inclusion criteria by sport',
      blocks: [
        {
          kind: 'table',
          caption: 'Inclusion criteria of the launch sports',
          headers: ['Sport', 'Gets in if they meet at least one'],
          rows: [
            ['Football', 'Ballon d’Or or FIFA The Best · world champion with an individual award at the World Cup (World Cup Golden Ball, top scorer) · top 10 official all-time scorers'],
            ['Swimming', '2 or more individual Olympic golds · world record holder in an Olympic event for 2 years or more · 5 or more individual world titles'],
            ['Chess', 'World champion (classical, historical lineage and FIDE) · FIDE world no. 1 for 12 months or more · women’s world champion'],
            ['Boxing', 'Undisputed champion (all major belts) · lineal champion · member of the International Boxing Hall of Fame'],
            ['Counter-Strike', 'Major champion with an MVP award · 2 or more Majors · no. 1 in the annual HLTV Top 20'],
          ],
        },
        { kind: 'notice', tone: 'info', text: 'The site’s other sports follow the same logic; each one’s criteria are published here as the curators approve them.' },
      ],
    },
    {
      id: 'niveis',
      title: 'Champion tiers',
      blocks: [{ kind: 'p', text: 'Being on the site already means being a champion. The tier measures the size of the legacy within their own sport.' }],
    },
    {
      id: 'como-atribui',
      title: 'How the tier is assigned',
      blocks: [
        {
          kind: 'list',
          ordered: true,
          items: [
            `Objective score (legacy score): the sum of achievements, weighted by competition level (world ${w.world}, continental ${w.continental}, national ${w.national}, local ${w.local}), rarity, years at the top and standing records.`,
            'The score becomes a percentile within the sport, because a world title in chess is not the same as one in football.',
            `Automatic suggestion: percentile ${TIER_PERCENTILE_THRESHOLD.legendary} or above → Legendary candidate; ${TIER_PERCENTILE_THRESHOLD.elite} or above → Elite; the rest → Champion.`,
            'Mythic is never automatic: it requires the “Game changer” dossier (see below).',
            'Every tier change is versioned, with a public justification and history.',
          ],
        },
      ],
    },
    {
      id: 'mitico',
      title: 'Mythic and the Hall of Greats',
      blocks: [
        {
          kind: 'p',
          text: `To be Mythic, an athlete needs a dossier with at least ${MYTHIC_MIN_EVIDENCES} of the pieces of evidence below, reviewed and approved by the curators (preferably by two administrators). The Mythics make up the Hall of Greats.`,
        },
        {
          kind: 'list',
          items: [
            'A technique, style or strategy named after them or that became the standard.',
            'A record that lasted decades or redefined the limit of the sport.',
            'A change of rules, format or market caused by them.',
            'Global popularization of the sport or of a region.',
            'Institutional recognition as the greatest of all time (“of the century” award, the highest honor of a hall of fame).',
          ],
        },
      ],
    },
    {
      id: 'campeonatos',
      title: 'Championship and award level',
      blocks: [
        {
          kind: 'p',
          text: 'Every competition and award has a level, shown on every achievement and used in the filters. The Olympic Games are world level; awards use the same scale.',
        },
      ],
    },
    {
      id: 'comunidade',
      title: 'The community vote',
      blocks: [
        {
          kind: 'p',
          text: 'Account holders vote on the tier they think is fair for each athlete (one vote per athlete, which can be changed). When the majority disagrees with the official tier, the curators get a signal to review the case. The curators always decide, with a justification.',
        },
      ],
    },
  ],
};
