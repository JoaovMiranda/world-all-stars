import fs from 'node:fs';

// Handoff v3 §11: catalog data is English at the source. The prototype mock was written with Portuguese slugs; the
// loader renames them with THIS map (seed and web fixtures see the same slugs) and the seed stores old → new in
// slug_redirects, so old URLs answer 301. Slugs already in English are not listed.
export const ENGLISH_SLUGS = {
  sport_groups: { fisico: 'physical', eletronico: 'electronic' },
  sport_subgroups: {
    coletivos: 'team-sports', tabuleiro: 'board-games', aquaticos: 'aquatics', combate: 'combat', tradicionais: 'traditional',
    nauticos: 'nautical', radicais: 'extreme', forca: 'strength', raquete: 'racket', precisao: 'precision',
  },
  sports: {
    futebol: 'football', xadrez: 'chess', natacao: 'swimming', boxe: 'boxing', 'esportes-indigenas': 'indigenous-sports',
    vela: 'sailing', 'salto-de-penhasco': 'cliff-diving', 'queda-de-braco': 'arm-wrestling', tenis: 'tennis',
    fisiculturismo: 'bodybuilding', golfe: 'golf',
  },
  sport_categories: {
    'futebol-masculino': 'football-men', 'natacao-borboleta': 'swimming-butterfly', 'natacao-100-borboleta': 'swimming-100-butterfly',
    'natacao-200-borboleta': 'swimming-200-butterfly', 'natacao-medley': 'swimming-medley', 'natacao-200-medley': 'swimming-200-medley',
    'natacao-400-medley': 'swimming-400-medley', 'natacao-revezamento': 'swimming-relay', 'natacao-4x200-livre': 'swimming-4x200-freestyle',
    'natacao-4x100-medley': 'swimming-4x100-medley', 'natacao-livre': 'swimming-freestyle', 'natacao-200-livre': 'swimming-200-freestyle',
    'natacao-4x100-livre': 'swimming-4x100-freestyle', 'boxe-pesado': 'boxing-heavyweight', 'mma-peso-medio': 'mma-middleweight',
    'high-diving-masculino': 'high-diving-men', 'queda-de-braco-superpesado': 'arm-wrestling-super-heavyweight',
    'xadrez-classico': 'chess-classical', 'xadrez-rapido': 'chess-rapid', 'xadrez-blitz': 'chess-blitz',
    'tenis-simples-masculino': 'tennis-men-singles', 'bjj-faixa-preta': 'bjj-black-belt', 'fisiculturismo-open': 'bodybuilding-open',
    'muay-thai-profissional': 'muay-thai-professional', 'golfe-masculino': 'golf-men',
  },
  competitions: {
    'copa-do-mundo-fifa': 'fifa-world-cup', 'copa-intercontinental': 'intercontinental-cup', 'campeonato-brasileiro': 'brazilian-championship',
    'torneio-rio-sao-paulo': 'rio-sao-paulo-tournament', 'jogos-olimpicos-natacao': 'olympic-swimming', 'mundial-de-natacao': 'world-aquatics-championships',
    'cinturao-wbc-pesado': 'wbc-heavyweight-title', 'cinturao-wba-pesado': 'wba-heavyweight-title', 'cinturao-ibf-pesado': 'ibf-heavyweight-title',
    'the-ring-pesado': 'the-ring-heavyweight-title', 'junior-olympics-boxe': 'junior-olympics-boxing', 'major-cs': 'cs-major',
    'jogos-olimpicos-futebol': 'olympic-football', 'copa-das-confederacoes': 'fifa-confederations-cup', 'mundial-de-clubes': 'fifa-club-world-cup',
    'recopa-sul-americana': 'recopa-sudamericana', 'supercopa-espanha': 'supercopa-de-espana', 'cinturao-ufc-medio': 'ufc-middleweight-title',
    'cinturao-shooto-medio': 'shooto-middleweight-title', 'jogos-olimpicos-vela': 'olympic-sailing', 'mundial-laser': 'laser-world-championship',
    'mundial-match-racing': 'match-racing-world-championship', 'mundial-high-diving': 'world-aquatics-high-diving',
    'mundial-de-queda-de-braco': 'world-armwrestling-championship', 'europeu-de-queda-de-braco': 'european-armwrestling-championship',
    'mundial-de-xadrez': 'world-chess-championship', 'mundial-de-xadrez-rapido': 'world-rapid-chess-championship',
    'mundial-de-xadrez-blitz': 'world-blitz-chess-championship', 'copa-do-mundo-de-xadrez': 'chess-world-cup',
    'mundial-de-xadrez-freestyle': 'freestyle-chess-world-championship', 'jogos-olimpicos-tenis': 'olympic-tennis',
    'mundial-ibjjf': 'ibjjf-world-championship', 'cinturao-lumpinee': 'lumpinee-stadium-title', 'cinturao-mtaa-mundial': 'mtaa-world-title',
    'cinturao-wmc-mundial': 'wmc-world-title', 'cinturao-wbc-muaythai-diamond': 'wbc-muay-thai-diamond-belt',
    'cinturao-wpmf-mundial': 'wpmf-world-title', 'cinturao-yokkao': 'yokkao-title', 'cinturao-paba-pena': 'paba-featherweight-title',
    'us-open-golfe': 'us-open-golf', 'mundial-de-natacao-25m': 'world-swimming-championships-25m',
    'mundial-rapido-blitz': 'world-rapid-blitz-chess-championships', 'trofeu-jose-finkel': 'jose-finkel-trophy',
  },
  awards: {
    'fifa-jogador-do-seculo': 'fifa-player-of-the-century', 'coi-atleta-do-seculo': 'ioc-athlete-of-the-century',
    'bola-de-ouro-honra': 'ballon-dor-prix-dhonneur', 'bola-de-ouro-da-copa': 'world-cup-golden-ball', 'melhor-jovem-da-copa': 'world-cup-best-young-player',
    'artilheiro-paulista': 'campeonato-paulista-top-scorer', 'nadador-do-ano-sw': 'swimming-world-swimmer-of-the-year',
    'nadador-do-ano-fina': 'fina-swimmer-of-the-year', 'bola-de-ouro-confederacoes': 'confederations-cup-golden-ball',
    'melhor-libertadores': 'copa-libertadores-best-player', 'futebolista-sul-americano': 'south-american-footballer-of-the-year',
    'bola-de-ouro-copa-america': 'copa-america-best-player', 'melhor-ligue-1': 'ligue-1-player-of-the-year',
  },
  teams: {
    'selecao-brasileira': 'brazil-national-team', 'selecao-eua-natacao': 'united-states-swimming-team',
    'selecao-da-gra-bretanha-vela-olimpica': 'great-britain-olympic-sailing-team', 'gra-bretanha': 'great-britain',
    'selecao-sul-coreana-de-esports': 'south-korea-esports-team', 'coreia-do-sul': 'south-korea',
    'selecao-britanica-de-saltos-ornamentais': 'great-britain-diving-team', 'selecao-francesa-de-saltos-ornamentais': 'france-diving-team',
    'selecao-da-servia-copa-davis': 'serbia-davis-cup-team', servia: 'serbia', 'selecao-dos-eua-ryder-cup': 'united-states-ryder-cup-team',
  },
  organizations: { coi: 'ioc', 'comite-intertribal': 'intertribal-committee', 'coroa-britanica': 'british-crown', 'comunidade-aom': 'aom-community', 'governo-eua': 'us-government' },
  observance_days: {
    'dia-do-esportista': 'sportspersons-day', 'dia-esporte-desenvolvimento-paz': 'international-day-of-sport-for-development-and-peace',
    'dia-mundial-do-futebol': 'world-football-day', 'dia-olimpico': 'olympic-day', 'dia-nacional-do-futebol': 'national-football-day',
    'dia-mundial-do-xadrez': 'world-chess-day', 'dia-esporte-universitario': 'international-day-of-university-sport',
  },
  sources: { 'rsssf-brasil': 'rsssf-brazil' },
};

/**
 * Renames the slugs of the loaded prototype DB in place and returns the redirects [{ table, oldSlug, newSlug, id }].
 * Text fields that store a slug by value (e.g. `sport` in collected reports) are renamed by the caller.
 */
export const applyEnglishSlugs = (db) => {
  const redirects = [];
  for (const [table, map] of Object.entries(ENGLISH_SLUGS)) {
    for (const row of db.tables[table] ?? []) {
      const next = map[row.slug];
      if (next) {
        redirects.push({ table, oldSlug: row.slug, newSlug: next, id: row.id });
        row.slug = next;
      }
    }
  }
  return redirects;
};

/** old slug → new slug of one table (for values stored by slug outside the slug column). */
export const englishSlug = (table, slug) => ENGLISH_SLUGS[table]?.[slug] ?? slug;

/** Base text columns (no translation table) written in Portuguese in the mock → English (table|id|column → text). */
const BASE_TEXT = JSON.parse(fs.readFileSync(new URL('./english-base-text.json', import.meta.url), 'utf8'));

/** Replaces the Portuguese base texts of the loaded prototype DB in place; returns how many were replaced. */
export const applyEnglishBaseText = (db) => {
  let n = 0;
  for (const [key, text] of Object.entries(BASE_TEXT)) {
    const [table, id, column] = key.split('|');
    const row = (db.tables[table] ?? []).find((r) => r.id === id);
    if (row && row[column] != null) { row[column] = text; n++; }
  }
  return n;
};
