// Curated DISCOVERY seed of sports (handoff v3 §11.5, appendix A): the user's list, normalized in English.
// Not the truth: build-sports-catalog.mjs resolves each Wikipedia title to its Wikidata item (QID, en/pt/es labels)
// and writes data/catalog/sports.catalog.json + a review report. Every entry becomes ONE sport with its own card on
// /sports; programmes (Olympics, World Games…) are badges, never containers.
//
// Tuple: [slug, enwiki title | null, subgroup, format, environment, parent slug | null, programmes]
// Programmes: <EVENT>[suffix][:years|:class]. Events: OS (Olympic summer) · OW (Olympic winter) · YOG (Youth Olympic Games)
//             WG (World Games) · CG (Commonwealth Games, :core|optional|recognized) · AG (Asian Games) · MS (IMSA World Mind Sports Games).
//             No suffix = current · f = confirmed_future · d = discontinued · x = demonstration (years listed after ':').
//             YOG is always youth_only (optionally with the editions held, e.g. YOG:2018,2026).
//             e.g. OS · OSf:2028 · OSd:1900 · OSx:1968,1984 · OWx:1988 · YOG:2018

/** Navigation subgroups added for the catalog (group, en, pt-BR, es); the existing 13 stay. */
export const NEW_SUBGROUPS = [
  ['winter', 'physical', 'Winter sports', 'Esportes de inverno', 'Deportes de invierno'],
  ['athletics-endurance', 'physical', 'Athletics and endurance', 'Atletismo e resistência', 'Atletismo y resistencia'],
  ['gymnastics-artistic', 'physical', 'Gymnastics and artistic', 'Ginástica e artísticos', 'Gimnasia y artísticos'],
  ['wheels', 'physical', 'Wheels', 'Sobre rodas', 'Sobre ruedas'],
  ['equestrian', 'physical', 'Equestrian', 'Equestres', 'Ecuestres'],
  ['card-games', 'mental', 'Card games', 'Jogos de cartas', 'Juegos de cartas'],
];

/** Multi-sport events whose programmes the catalog records (slug, organization slug, en, pt-BR, es). */
export const MULTISPORT_EVENTS = {
  OS: ['olympic-games-summer', 'ioc', 'Summer Olympic Games', 'Jogos Olímpicos de Verão', 'Juegos Olímpicos de Verano'],
  OW: ['olympic-games-winter', 'ioc', 'Winter Olympic Games', 'Jogos Olímpicos de Inverno', 'Juegos Olímpicos de Invierno'],
  YOG: ['youth-olympic-games', 'ioc', 'Youth Olympic Games', 'Jogos Olímpicos da Juventude', 'Juegos Olímpicos de la Juventud'],
  WG: ['world-games', 'iwga', 'The World Games', 'Jogos Mundiais', 'Juegos Mundiales'],
  CG: ['commonwealth-games', 'cgf', 'Commonwealth Games', 'Jogos da Commonwealth', 'Juegos de la Mancomunidad'],
  AG: ['asian-games', 'oca', 'Asian Games', 'Jogos Asiáticos', 'Juegos Asiáticos'],
  MS: ['mind-sports-games', 'imsa', 'Mind Sports Games', 'Jogos de Esportes da Mente', 'Juegos de Deportes Mentales'],
};
export const MULTISPORT_ORGS = {
  ioc: 'International Olympic Committee',
  iwga: 'International World Games Association',
  cgf: 'Commonwealth Games Federation',
  oca: 'Olympic Council of Asia',
  imsa: 'International Mind Sports Association',
};

export const SPORTS = [
  // ── Olympic summer programme (Paris 2024) ──
  ['aquatics', 'Aquatics', 'aquatics', 'individual', 'closed', null, 'OS'],
  ['swimming', 'Swimming', 'aquatics', 'individual', 'closed', 'aquatics', 'OS CG:core AG'],
  ['marathon-swimming', 'Open water swimming', 'aquatics', 'individual', 'open', 'aquatics', 'OS'],
  ['artistic-swimming', 'Synchronised swimming', 'aquatics', 'judged', 'closed', 'aquatics', 'OS CG:recognized AG'],
  ['diving', 'Diving (sport)', 'aquatics', 'judged', 'closed', 'aquatics', 'OS CG:optional AG'],
  ['water-polo', 'Water polo', 'aquatics', 'team', 'closed', 'aquatics', 'OS CG:recognized AG'],
  ['cliff-diving', 'High diving', 'extreme', 'judged', 'closed', 'aquatics', ''],
  ['archery', 'Archery', 'precision', 'individual', 'open', null, 'OS WG CG:optional AG'],
  ['athletics', 'Sport of athletics', 'athletics-endurance', 'individual', 'open', null, 'OS CG:core AG'],
  ['badminton', 'Badminton', 'racket', 'duel', 'closed', null, 'OS OSx:1972 WG CG:core AG'],
  ['basketball', 'Basketball', 'team-sports', 'team', 'closed', null, 'OS CG:optional AG'],
  ['basketball-3x3', '3x3 basketball', 'team-sports', 'team', 'open', 'basketball', 'OS AG'],
  ['boxing', 'Boxing', 'combat', 'duel', 'closed', null, 'OS CG:core AG'],
  ['breaking', 'Breakdancing', 'gymnastics-artistic', 'judged', 'closed', 'dancesport', 'OSd:2024 YOG:2018 AG'],
  ['canoe', 'Canoeing', 'nautical', 'individual', 'open', null, 'OS WG CG:recognized AG'],
  ['canoe-sprint', 'Canoe sprint', 'nautical', 'individual', 'open', 'canoe', 'OS AG'],
  ['canoe-slalom', 'Canoe slalom', 'nautical', 'individual', 'open', 'canoe', 'OS AG'],
  ['cycling', 'Cycle sport', 'wheels', 'individual', 'open', null, 'OS WG CG:core AG'],
  ['cycling-bmx-freestyle', 'Freestyle BMX', 'wheels', 'judged', 'open', 'cycling', 'OS'],
  ['cycling-bmx-racing', 'BMX racing', 'wheels', 'individual', 'open', 'cycling', 'OS AG'],
  ['cycling-mountain-bike', 'Mountain bike racing', 'wheels', 'individual', 'open', 'cycling', 'OS CG:optional AG'],
  ['cycling-road', 'Road bicycle racing', 'wheels', 'individual', 'open', 'cycling', 'OS CG:core AG'],
  ['cycling-track', 'Track cycling', 'wheels', 'individual', 'closed', 'cycling', 'OS CG:optional AG'],
  ['equestrian', 'Equestrianism', 'equestrian', 'individual', 'open', null, 'OS AG'],
  ['equestrian-dressage', 'Dressage', 'equestrian', 'judged', 'open', 'equestrian', 'OS'],
  ['equestrian-eventing', 'Eventing', 'equestrian', 'individual', 'open', 'equestrian', 'OS'],
  ['equestrian-jumping', 'Show jumping', 'equestrian', 'individual', 'open', 'equestrian', 'OS'],
  ['fencing', 'Fencing', 'combat', 'duel', 'closed', null, 'OS CG:optional AG'],
  ['football', 'Association football', 'team-sports', 'team', 'open', null, 'OS AG'],
  ['golf', 'Golf', 'precision', 'individual', 'closed', null, 'OS CG:recognized AG'],
  ['gymnastics', 'Gymnastics', 'gymnastics-artistic', 'judged', 'closed', null, 'OS WG CG:core AG'],
  ['gymnastics-artistic', 'Artistic gymnastics', 'gymnastics-artistic', 'judged', 'closed', 'gymnastics', 'OS CG:core AG'],
  ['gymnastics-rhythmic', 'Rhythmic gymnastics', 'gymnastics-artistic', 'judged', 'closed', 'gymnastics', 'OS CG:optional AG'],
  ['gymnastics-trampoline', 'Trampolining', 'gymnastics-artistic', 'judged', 'closed', 'gymnastics', 'OS AG'],
  ['handball', 'Handball', 'team-sports', 'team', 'closed', null, 'OS WG CG:recognized AG'],
  ['field-hockey', 'Field hockey', 'team-sports', 'team', 'open', null, 'OS WG CG:core AG'],
  ['judo', 'Judo', 'combat', 'duel', 'closed', null, 'OS CG:core AG'],
  ['modern-pentathlon', 'Modern pentathlon', 'athletics-endurance', 'individual', 'open', null, 'OS AG'],
  ['rowing', 'Rowing (sport)', 'nautical', 'individual', 'open', null, 'OS CG:optional AG'],
  ['rugby-sevens', 'Rugby sevens', 'team-sports', 'team', 'open', 'rugby', 'OS CG:core AG'],
  ['sailing', 'Sailing (sport)', 'nautical', 'individual', 'open', null, 'OS CG:recognized AG'],
  ['shooting', 'Shooting sports', 'precision', 'individual', 'open', null, 'OS CG:optional AG'],
  ['skateboarding', 'Skateboarding', 'wheels', 'judged', 'open', null, 'OS AG'],
  ['sport-climbing', 'Sport climbing', 'extreme', 'individual', 'closed', null, 'OS WG AG'],
  ['surfing', 'Surfing', 'nautical', 'judged', 'open', null, 'OS'],
  ['table-tennis', 'Table tennis', 'racket', 'duel', 'closed', null, 'OS CG:core AG'],
  ['taekwondo', 'Taekwondo', 'combat', 'duel', 'closed', null, 'OS OSx:1988,1992 CG:recognized AG'],
  ['tennis', 'Tennis', 'racket', 'duel', 'open', null, 'OS OSx:1968,1984 CG:recognized AG'],
  ['triathlon', 'Triathlon', 'athletics-endurance', 'individual', 'open', null, 'OS WG CG:optional AG'],
  ['volleyball', 'Volleyball', 'team-sports', 'team', 'closed', null, 'OS CG:recognized AG'],
  ['beach-volleyball', 'Beach volleyball', 'team-sports', 'team', 'open', 'volleyball', 'OS CG:optional AG'],
  ['weightlifting', 'Olympic weightlifting', 'strength', 'individual', 'closed', null, 'OS CG:core AG'],
  ['wrestling', 'Wrestling', 'combat', 'duel', 'closed', null, 'OS CG:core AG'],
  ['wrestling-freestyle', 'Freestyle wrestling', 'combat', 'duel', 'closed', 'wrestling', 'OS'],
  ['wrestling-greco-roman', 'Greco-Roman wrestling', 'combat', 'duel', 'closed', 'wrestling', 'OS'],
  // ── Confirmed for Los Angeles 2028 ──
  ['baseball', 'Baseball', 'team-sports', 'team', 'open', null, 'OSd:1992,1996,2000,2004,2008,2020 OSx:1912,1936,1956,1964,1984,1988 OSf:2028 WG AG'],
  ['softball', 'Softball', 'team-sports', 'team', 'open', null, 'OSd:1996,2000,2004,2008,2020 OSf:2028 WG CG:recognized AG'],
  ['cricket', 'Cricket', 'team-sports', 'team', 'open', null, 'OSd:1900 OSf:2028 CG:optional AG'],
  ['flag-football', 'Flag football', 'team-sports', 'team', 'open', 'american-football', 'OSf:2028 WG'],
  ['lacrosse', 'Lacrosse', 'team-sports', 'team', 'open', null, 'OSd:1904,1908 OSx:1928,1932,1948 OSf:2028 WG'],
  ['squash', 'Squash (sport)', 'racket', 'duel', 'closed', null, 'OSf:2028 WG CG:core AG'],
  ['coastal-rowing', 'Coastal and ocean rowing', 'nautical', 'individual', 'open', 'rowing', 'OSf:2028'],
  // ── Youth Olympic Games and other Olympic-family programmes ──
  ['baseball5', 'Baseball5', 'team-sports', 'team', 'open', 'baseball', 'YOG:2026'],
  ['beach-wrestling', 'Beach wrestling', 'combat', 'duel', 'open', 'wrestling', 'YOG:2018'],
  ['wushu', 'Wushu (sport)', 'combat', 'judged', 'closed', null, 'WG AG'],
  ['wushu-taolu', 'Taolu', 'combat', 'judged', 'closed', 'wushu', 'YOG:2026'],
  ['futsal', 'Futsal', 'team-sports', 'team', 'closed', 'football', 'YOG:2018'],
  ['beach-handball', 'Beach handball', 'team-sports', 'team', 'open', 'handball', 'YOG:2018 WG'],
  ['inline-speed-skating', 'Inline speed skating', 'wheels', 'individual', 'closed', 'roller-sports', 'YOG:2018 WG'],
  ['gymnastics-acrobatic', 'Acrobatic gymnastics', 'gymnastics-artistic', 'judged', 'closed', 'gymnastics', 'WG'],
  ['karate', 'Karate', 'combat', 'duel', 'closed', null, 'OSd:2020 WG CG:recognized AG'],
  // ── Olympic winter programme ──
  ['biathlon', 'Biathlon', 'winter', 'individual', 'open', null, 'OW'],
  ['bobsleigh', 'Bobsleigh', 'winter', 'individual', 'open', null, 'OW'],
  ['skeleton', 'Skeleton (sport)', 'winter', 'individual', 'open', 'bobsleigh', 'OW'],
  ['curling', 'Curling', 'winter', 'team', 'closed', null, 'OW OWx:1932,1988,1992 CG:recognized'],
  ['ice-hockey', 'Ice hockey', 'winter', 'team', 'closed', null, 'OW OSd:1920'],
  ['luge', 'Luge', 'winter', 'individual', 'open', null, 'OW'],
  ['skating', 'Ice skating', 'winter', 'individual', 'closed', null, 'OW'],
  ['figure-skating', 'Figure skating', 'winter', 'judged', 'closed', 'skating', 'OW OSd:1908,1920'],
  ['speed-skating', 'Speed skating', 'winter', 'individual', 'closed', 'skating', 'OW'],
  ['short-track-speed-skating', 'Short-track speed skating', 'winter', 'individual', 'closed', 'skating', 'OW OWx:1988'],
  ['skiing', 'Skiing', 'winter', 'individual', 'open', null, 'OW'],
  ['alpine-skiing', 'Alpine skiing', 'winter', 'individual', 'open', 'skiing', 'OW'],
  ['cross-country-skiing', 'Cross-country skiing', 'winter', 'individual', 'open', 'skiing', 'OW'],
  ['freestyle-skiing', 'Freestyle skiing', 'winter', 'judged', 'open', 'skiing', 'OW OWx:1988'],
  ['nordic-combined', 'Nordic combined', 'winter', 'individual', 'open', 'skiing', 'OW'],
  ['ski-jumping', 'Ski jumping', 'winter', 'judged', 'open', 'skiing', 'OW'],
  ['snowboarding', 'Snowboarding', 'winter', 'judged', 'open', 'skiing', 'OW'],
  ['ski-mountaineering', 'Ski mountaineering', 'winter', 'individual', 'open', null, 'OW'],
  // ── Discontinued Olympic sports ──
  ['basque-pelota', 'Basque pelota', 'racket', 'duel', 'open', null, 'OSd:1900 OSx:1924,1968,1992'],
  ['croquet', 'Croquet', 'precision', 'individual', 'open', null, 'OSd:1900'],
  ['jeu-de-paume', 'Real tennis', 'racket', 'duel', 'closed', null, 'OSd:1908'],
  ['motorboating', 'Motorboat racing', 'nautical', 'individual', 'open', null, 'OSd:1908'],
  ['polo', 'Polo', 'equestrian', 'team', 'open', null, 'OSd:1900,1908,1920,1924,1936'],
  ['rackets', 'Racquets (sport)', 'racket', 'duel', 'closed', null, 'OSd:1908'],
  ['roque', 'Roque', 'precision', 'individual', 'open', null, 'OSd:1904'],
  ['rugby-union', 'Rugby union', 'team-sports', 'team', 'open', 'rugby', 'OSd:1900,1908,1920,1924'],
  ['tug-of-war', 'Tug of war', 'strength', 'team', 'open', null, 'OSd:1900,1904,1908,1912,1920 WG'],
  // ── The World Games (IWGA) ──
  ['aikido', 'Aikido', 'combat', 'judged', 'closed', null, 'WG'],
  ['air-sports', 'Air sports', 'extreme', 'individual', 'open', null, 'WG'],
  ['american-football', 'American football', 'team-sports', 'team', 'open', null, 'WG'],
  ['cue-sports', 'Cue sports', 'precision', 'duel', 'closed', null, 'WG CG:recognized AG'],
  ['boules', 'Boules', 'precision', 'individual', 'open', null, 'WG'],
  ['bowling', 'Bowling', 'precision', 'individual', 'closed', null, 'OSx:1988 WG CG:recognized AG'],
  ['casting', 'Casting (fishing)', 'precision', 'individual', 'open', null, 'WG'],
  ['cheerleading', 'Cheerleading', 'gymnastics-artistic', 'judged', 'closed', null, 'WG'],
  ['dancesport', 'Dancesport', 'gymnastics-artistic', 'judged', 'closed', null, 'WG AG'],
  ['fistball', 'Fistball', 'team-sports', 'team', 'open', null, 'WG'],
  ['floorball', 'Floorball', 'team-sports', 'team', 'closed', null, 'WG'],
  ['flying-disc', 'Ultimate (sport)', 'team-sports', 'team', 'open', null, 'WG'],
  ['ju-jitsu', 'Jujutsu', 'combat', 'duel', 'closed', null, 'WG AG'],
  ['kickboxing', 'Kickboxing', 'combat', 'duel', 'closed', null, 'WG'],
  ['korfball', 'Korfball', 'team-sports', 'team', 'closed', null, 'WG'],
  ['lifesaving', 'Lifesaving', 'aquatics', 'individual', 'open', null, 'WG CG:recognized'],
  ['minigolf', 'Miniature golf', 'precision', 'individual', 'open', null, 'WG'],
  ['muay-thai', 'Muay Thai', 'combat', 'duel', 'closed', null, 'WG'],
  ['orienteering', 'Orienteering', 'athletics-endurance', 'individual', 'open', null, 'WG'],
  ['powerlifting', 'Powerlifting', 'strength', 'individual', 'closed', null, 'WG CG:core'],
  ['racquetball', 'Racquetball', 'racket', 'duel', 'closed', null, 'WG'],
  ['roller-sports', 'Roller sports', 'wheels', 'individual', 'closed', null, 'OSx:1992 WG AG'],
  ['rugby', 'Rugby football', 'team-sports', 'team', 'open', null, 'WG'],
  ['sambo', 'Sambo (martial art)', 'combat', 'duel', 'closed', null, 'WG'],
  ['sumo', 'Sumo', 'combat', 'duel', 'closed', null, 'WG'],
  ['underwater-sports', 'Underwater sports', 'aquatics', 'individual', 'open', null, 'WG'],
  ['water-skiing', 'Water skiing', 'nautical', 'judged', 'open', null, 'OSx:1972 WG'],
  ['bodybuilding', 'Bodybuilding', 'strength', 'judged', 'closed', null, 'WG AG'],
  ['chess', 'Chess', 'board-games', 'duel', 'closed', null, 'WG CG:recognized AG MS'],
  // ── Commonwealth Games (not listed above) ──
  ['lawn-bowls', 'Bowls', 'precision', 'individual', 'open', null, 'CG:core'],
  ['netball', 'Netball', 'team-sports', 'team', 'closed', null, 'CG:core'],
  ['bridge', 'Contract bridge', 'card-games', 'team', 'closed', null, 'CG:recognized AG MS'],
  // ── Asian Games (not listed above) ──
  ['kabaddi', 'Kabaddi', 'team-sports', 'team', 'closed', null, 'AG'],
  ['sepak-takraw', 'Sepak takraw', 'team-sports', 'team', 'closed', null, 'AG'],
  ['soft-tennis', 'Soft tennis', 'racket', 'duel', 'open', null, 'AG'],
  ['dragon-boat', 'Dragon boat', 'nautical', 'team', 'open', 'canoe', 'AG'],
  // ── Mind sports ──
  ['draughts', 'Draughts', 'board-games', 'duel', 'closed', null, 'MS'],
  ['shogi', 'Shogi', 'board-games', 'duel', 'closed', null, ''],
  ['backgammon', 'Backgammon', 'board-games', 'duel', 'closed', null, ''],
  ['xiangqi', 'Xiangqi', 'board-games', 'duel', 'closed', null, 'MS AG'],
  ['othello', 'Reversi', 'board-games', 'duel', 'closed', null, ''],
  ['poker', 'Poker', 'card-games', 'individual', 'closed', null, ''],
  ['cribbage', 'Cribbage', 'card-games', 'duel', 'closed', null, ''],
  ['mastermind', 'Mastermind (board game)', 'board-games', 'individual', 'closed', null, ''],
  ['go', 'Go (game)', 'board-games', 'duel', 'closed', null, 'MS AG'],
];

/**
 * Former names / rebrands kept as aliases with their period (never separate sports).
 * Tuple: [name, name_kind, validFromYear | null, validToYear | null] — years only when publicly verifiable (T1.5 review).
 */
export const SPORT_ALIASES = {
  // FINA renamed synchronised swimming to artistic swimming at its July 2017 congress.
  'artistic-swimming': [
    ['Synchronized swimming', 'former', null, 2017],
    ['Synchronised swimming', 'former', null, 2017],
  ],
  breaking: [['Breaking', 'official', null, null]],
  'coastal-rowing': [['Coastal Rowing Beach Sprint', 'official', null, null]],
  othello: [['Othello', 'international', null, null]],
  'cue-sports': [['Billiards', 'international', null, null]],
  'flying-disc': [['Ultimate', 'international', null, null]],
  'gymnastics-trampoline': [['Trampoline', 'international', null, null]],
};

/**
 * Proposed / unverified renames: listed in the report, NOT emitted as aliases until a source is recorded
 * (a wrong "former name" would create false search hits and wrong history).
 */
export const PENDING_ALIASES = {
  canoe: [['Paddle', 'ICF "Paddle" rebranding of canoe disciplines — reviewed, needs source (no verified date or official adoption).']],
  'canoe-sprint': [['Sprint Paddle', 'Proposed ICF discipline name — reviewed, needs source. Was wrongly marked "former".']],
  'canoe-slalom': [['Slalom Paddle', 'Proposed ICF discipline name — reviewed, needs source. Was wrongly marked "former".']],
};

/** Display names that override an outdated Wikidata label (the outdated label stays as a `former` alias). */
export const NAME_OVERRIDES = {
  'artistic-swimming': { en: 'Artistic swimming', 'pt-BR': 'Nado artístico' },
  breaking: { en: 'Breaking' },
};

/**
 * Governing bodies whose names or Olympic roles changed (v3 §15.16). Data only: the DB seeder does not consume this
 * yet (organizations + organization_roles with period). Tuple per alias: [name, name_kind, validFromYear, validToYear].
 */
export const FEDERATIONS = [
  {
    slug: 'iba',
    name: 'International Boxing Association',
    sports: ['boxing'],
    aliases: [
      ['AIBA', 'former', 1946, 2021],
      ['Association Internationale de Boxe Amateur', 'former', 1946, null],
    ],
    note: 'AIBA renamed IBA in December 2021. IOC suspended recognition in 2019 (Tokyo 2020 and Paris 2024 boxing run by an IOC unit) and withdrew it in June 2023. Not the Olympic governing body from 2019.',
    olympicRole: { from: null, to: 2019 },
  },
  {
    slug: 'world-boxing',
    name: 'World Boxing',
    sports: ['boxing'],
    aliases: [],
    note: 'Founded April 2023; IOC provisional recognition February 2025; boxing confirmed for LA 2028 (March 2025) under World Boxing. Distinct organisation from IBA (not a rename).',
    olympicRole: { from: 2025, to: null },
  },
  {
    slug: 'world-rowing',
    name: 'World Rowing',
    sports: ['rowing', 'coastal-rowing'],
    aliases: [
      ['FISA', 'former', 1892, 2008],
      ["Fédération Internationale des Sociétés d'Aviron", 'official', 1892, null],
    ],
    note: 'Founded 1892 as FISA; brand "World Rowing" adopted in 2008 (FISA remains the legal name).',
    olympicRole: { from: null, to: null },
  },
  {
    slug: 'united-world-wrestling',
    name: 'United World Wrestling',
    sports: ['wrestling', 'beach-wrestling'],
    aliases: [
      ['FILA', 'former', null, 2014],
      ['Fédération Internationale des Luttes Associées', 'former', null, 2014],
    ],
    note: 'FILA renamed United World Wrestling (UWW) in September 2014.',
    olympicRole: { from: null, to: null },
  },
  {
    slug: 'icf',
    name: 'International Canoe Federation',
    sports: ['canoe', 'canoe-sprint', 'canoe-slalom', 'dragon-boat'],
    aliases: [['ICF', 'international', null, null]],
    note: '"Paddle" rebranding: reviewed — needs source (see PENDING_ALIASES).',
    olympicRole: { from: null, to: null },
  },
  {
    slug: 'world-aquatics',
    name: 'World Aquatics',
    sports: ['aquatics', 'swimming', 'marathon-swimming', 'artistic-swimming', 'diving', 'water-polo', 'cliff-diving'],
    aliases: [
      ['FINA', 'former', 1908, 2022],
      ['Fédération Internationale de Natation', 'former', 1908, 2022],
    ],
    note: 'FINA (founded 1908) renamed World Aquatics in December 2022.',
    olympicRole: { from: null, to: null },
  },
  {
    slug: 'world-athletics',
    name: 'World Athletics',
    sports: ['athletics'],
    aliases: [
      ['IAAF', 'former', 1912, 2019],
      ['International Association of Athletics Federations', 'former', 2001, 2019],
    ],
    note: 'IAAF (founded 1912) rebranded World Athletics in 2019; "International Amateur Athletic Federation" until 2001.',
    olympicRole: { from: null, to: null },
  },
  {
    slug: 'world-sailing',
    name: 'World Sailing',
    sports: ['sailing'],
    aliases: [
      ['ISAF', 'former', 1996, 2015],
      ['International Sailing Federation', 'former', 1996, 2015],
    ],
    note: 'ISAF renamed World Sailing in 2015 (earlier IYRU until 1996).',
    olympicRole: { from: null, to: null },
  },
  {
    slug: 'world-archery',
    name: 'World Archery',
    sports: ['archery'],
    aliases: [['FITA', 'former', 1931, 2011]],
    note: 'FITA (founded 1931) renamed World Archery in 2011.',
    olympicRole: { from: null, to: null },
  },
  {
    slug: 'world-taekwondo',
    name: 'World Taekwondo',
    sports: ['taekwondo'],
    aliases: [
      ['WTF', 'former', 1973, 2017],
      ['World Taekwondo Federation', 'former', 1973, 2017],
    ],
    note: 'World Taekwondo Federation (founded 1973) renamed World Taekwondo in 2017.',
    olympicRole: { from: null, to: null },
  },
  {
    slug: 'bwf',
    name: 'Badminton World Federation',
    sports: ['badminton'],
    aliases: [
      ['IBF', 'former', 1934, 2006],
      ['International Badminton Federation', 'former', 1934, 2006],
    ],
    note: 'International Badminton Federation (founded 1934) renamed BWF in 2006.',
    olympicRole: { from: null, to: null },
  },
  {
    slug: 'wbsc',
    name: 'World Baseball Softball Confederation',
    sports: ['baseball', 'softball', 'baseball5'],
    aliases: [],
    note: 'Formed 2013 by the merger of IBAF (baseball) and ISF (softball).',
    olympicRole: { from: null, to: null },
  },
];

/**
 * T1.5 review log (v3 §15.16–17). Every entry is printed in the report with its status:
 * `reviewed` (decision backed by a public fact stated in the note) or `reviewed — needs source`.
 */
export const REVIEW_LOG = {
  breaking: [
    'reviewed',
    'Olympic debut Paris 2024 only; not on the LA 2028 programme → OS discontinued (2024). YOG 2018 (Buenos Aires). Kept as a discipline of dancesport (WDSF governs breaking). Display name "Breaking" (official Olympic name).',
  ],
  'artistic-swimming': [
    'reviewed',
    'Renamed from synchronised swimming by FINA in 2017: display name fixed (Wikidata label outdated), old names kept as `former` aliases valid to 2017.',
  ],
  baseball: ['reviewed', 'Official 1992–2008 and 2020; demonstration 1912, 1936, 1956, 1964, 1984, 1988; confirmed for LA 2028 (IOC Session, October 2023).'],
  softball: ['reviewed', 'Official 1996–2008 and 2020; confirmed for LA 2028 (IOC Session, October 2023).'],
  cricket: ['reviewed', 'Official 1900 only; confirmed for LA 2028 (T20 format, IOC Session, October 2023).'],
  'flag-football': ['reviewed', 'Confirmed for LA 2028 (IOC Session, October 2023); discipline of American football (IFAF).'],
  lacrosse: ['reviewed', 'Official 1904, 1908; demonstration 1928, 1932, 1948; confirmed for LA 2028 (sixes format).'],
  squash: ['reviewed', 'Never on the Olympic programme before; confirmed for LA 2028 (IOC Session, October 2023).'],
  'coastal-rowing': [
    'reviewed — needs source',
    'Coastal rowing beach sprint announced for LA 2028 (World Rowing); record the IOC decision date and URL before the final seed. No Wikidata item for the enwiki title.',
  ],
  karate: ['reviewed', 'Olympic only at Tokyo 2020; not at Paris 2024 nor LA 2028 → discontinued (2020).'],
  baseball5: ['reviewed', 'Youth Olympic Games only (Dakar 2026); not on the main Games programme.'],
  'beach-wrestling': ['reviewed', 'Youth Olympic Games only (Buenos Aires 2018). Dakar 2026 inclusion: needs source, not recorded.'],
  'wushu-taolu': ['reviewed', 'Youth Olympic Games only (Dakar 2026). Main-Games status: never Olympic (Beijing 2008 tournament was not an Olympic event).'],
  futsal: ['reviewed', 'Youth Olympic Games only (Buenos Aires 2018 replaced football with futsal); never on the main Games programme.'],
  'beach-handball': ['reviewed', 'Youth Olympic Games only (Buenos Aires 2018); never on the main Games programme.'],
  'inline-speed-skating': ['reviewed', 'Youth Olympic Games only (roller speed skating at Buenos Aires 2018).'],
  tennis: ['reviewed', 'Current; demonstration 1968 and 1984 before the 1988 return.'],
  taekwondo: ['reviewed', 'Current since 2000; demonstration 1988 and 1992.'],
  badminton: ['reviewed', 'Current since 1992; demonstration 1972 (1988 was an exhibition, not recorded).'],
  'basque-pelota': ['reviewed', 'Official 1900; demonstration 1924, 1968, 1992.'],
  bowling: ['reviewed', 'Demonstration sport at Seoul 1988; never official.'],
  'water-skiing': ['reviewed', 'Demonstration sport at Munich 1972; never official.'],
  'roller-sports': ['reviewed', 'Roller hockey was a demonstration sport at Barcelona 1992; never official.'],
  curling: ['reviewed', 'Current since 1998; demonstration 1932, 1988, 1992 (1924 tournament declared official by the IOC in 2006 — counted in current).'],
  'freestyle-skiing': ['reviewed', 'Current since 1992; demonstration 1988 (Calgary).'],
  'short-track-speed-skating': ['reviewed', 'Current since 1992; demonstration 1988 (Calgary).'],
  'ski-mountaineering': ['reviewed', 'Olympic debut at Milano Cortina 2026 → current.'],
  'ice-hockey': ['reviewed', 'First held at the 1920 Summer Games (Antwerp), then winter from 1924.'],
  'figure-skating': ['reviewed', 'Held at the 1908 and 1920 Summer Games, then winter from 1924.'],
  croquet: ['reviewed', 'Official only at Paris 1900 → discontinued (1900).'],
  'jeu-de-paume': ['reviewed', 'Official only at London 1908 → discontinued (1908).'],
  motorboating: ['reviewed', 'Official only at London 1908 → discontinued (1908). No Wikidata item for enwiki "Motorboat racing": needs a QID.'],
  polo: ['reviewed', 'Official 1900, 1908, 1920, 1924, 1936 → discontinued.'],
  rackets: ['reviewed', 'Official only at London 1908 → discontinued (1908). No Wikidata item for enwiki "Racquets (sport)": needs a QID.'],
  roque: ['reviewed', 'Official only at St. Louis 1904 → discontinued (1904).'],
  'rugby-union': [
    'reviewed',
    'Fifteen-a-side official 1900, 1908, 1920, 1924 → discontinued; the current Olympic form is rugby sevens (separate discipline, since 2016).',
  ],
  'tug-of-war': ['reviewed', 'Official 1900–1920. 1906 removed: the 1906 Intercalated Games are not recognised by the IOC.'],
  boxing: [
    'reviewed',
    'Current; LA 2028 confirmed (March 2025) under World Boxing. Federation change AIBA→IBA→World Boxing recorded in `federations` (IBA is not a rename of World Boxing).',
  ],
  rowing: ['reviewed', 'FISA→World Rowing (2008 brand) recorded in `federations`.'],
  wrestling: ['reviewed', 'FILA→United World Wrestling (2014) recorded in `federations`.'],
  canoe: [
    'reviewed — needs source',
    'ICF "Paddle" renaming not verified; previous `former` aliases (Paddlesport, Sprint Paddle, Slalom Paddle) withdrawn to PENDING_ALIASES.',
  ],
  'canoe-sprint': ['reviewed — needs source', 'See canoe.'],
  'canoe-slalom': ['reviewed — needs source', 'See canoe.'],
  chess: [
    'reviewed',
    'World Mind Sports Games (IMSA) programme: bridge, chess, draughts, go, xiangqi. Whether WMSG is still held (status `current`): needs source.',
  ],
  bridge: ['reviewed', 'See chess (IMSA World Mind Sports Games).'],
  draughts: ['reviewed', 'See chess (IMSA World Mind Sports Games). No Wikidata item for enwiki "Draughts" (disambiguation): needs a QID.'],
  go: ['reviewed', 'IMSA World Mind Sports Games; Asian Games 2010 and 2022. Not in the user list — kept, owner to confirm inclusion.'],
  xiangqi: ['reviewed', 'IMSA World Mind Sports Games; Asian Games 2010 and 2022.'],
  shogi: ['reviewed', 'Not on the IMSA World Mind Sports Games programme → MS programme removed (no programme badge).'],
  backgammon: ['reviewed', 'Not on the IMSA World Mind Sports Games programme → MS programme removed.'],
  othello: ['reviewed', 'Not on the IMSA World Mind Sports Games programme → MS programme removed.'],
  poker: [
    'reviewed — needs source',
    'Not on the IMSA World Mind Sports Games programme → MS programme removed. IMSA membership of the International Federation of Poker: needs source.',
  ],
  cribbage: ['reviewed', 'Not on the IMSA World Mind Sports Games programme → MS programme removed.'],
  mastermind: ['reviewed', 'Not on the IMSA World Mind Sports Games programme → MS programme removed (listed by the UK Mind Sports Olympiad, not modelled).'],
};

/**
 * Bulk review notes for whole programme classes that were not verified edition by edition (printed in the report).
 */
export const BULK_REVIEW = [
  [
    'reviewed',
    'OS / OW `current` rows (Paris 2024, Milano Cortina 2026, LA 2028 core programme) checked against the IOC programmes: no change besides the entries above.',
  ],
  [
    'reviewed — needs source',
    'CG core/optional/recognized classes: the CGF list changed several times (compulsory sports reduced to athletics and swimming; Glasgow 2026 runs 10 sports). Classes kept as seeded; verify against the current CGF constitution before the final seed.',
  ],
  ['reviewed — needs source', 'AG `current` rows: not checked against the Aichi-Nagoya 2026 programme.'],
  ['reviewed — needs source', 'WG `current` rows: not checked against the Chengdu 2025 programme.'],
];

/** Curated pt-BR/es names where Wikidata has no label yet (shown in the report as `curated`). */
export const CURATED_NAMES = {
  swimming: ['Natação', 'Natación'],
  'artistic-swimming': ['Nado artístico', 'Natación artística'],
  'cliff-diving': ['Saltos de grande altura', 'Saltos de gran altura'],
  'canoe-slalom': ['Canoagem slalom', 'Piragüismo en eslalon'],
  'cycling-bmx-freestyle': ['Ciclismo BMX freestyle', 'Ciclismo BMX estilo libre'],
  'cycling-bmx-racing': ['Ciclismo BMX racing', 'Ciclismo BMX carrera'],
  'cycling-mountain-bike': ['Ciclismo mountain bike', 'Ciclismo de montaña'],
  'coastal-rowing': ['Remo costeiro (beach sprint)', 'Remo de mar (beach sprint)'],
  baseball5: ['Baseball5', 'Baseball5'],
  'beach-wrestling': ['Luta de praia', 'Lucha en playa'],
  'wushu-taolu': ['Wushu taolu', 'Wushu taolu'],
  'cross-country-skiing': ['Esqui cross-country', 'Esquí de fondo'],
  motorboating: ['Motonáutica', 'Motonáutica'],
  rackets: ['Raquetes', 'Raquetas'],
  casting: ['Casting (arremesso de pesca)', 'Casting'],
  'flying-disc': ['Disco voador (ultimate)', 'Disco volador (ultimate)'],
  'roller-sports': ['Patinação sobre rodas', 'Deportes sobre ruedas'],
  'soft-tennis': ['Soft tênis', 'Tenis suave'],
  draughts: ['Damas', 'Damas'],
  cribbage: ['Cribbage', 'Cribbage'],
};
