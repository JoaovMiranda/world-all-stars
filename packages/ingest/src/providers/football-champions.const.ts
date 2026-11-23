/** Provider key of the World Cup / Olympic football champions. */
export const FOOTBALL_PROVIDER = 'football-champions';
/** Editions of the Olympic football tournaments (men / women). */
export const MEN_OLYMPIC_YEARS = [
  1908, 1912, 1920, 1924, 1928, 1936, 1948, 1952, 1956, 1960, 1964, 1968, 1972, 1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012, 2016, 2020, 2024,
];
export const WOMEN_OLYMPIC_YEARS = [1996, 2000, 2004, 2008, 2012, 2016, 2020, 2024];

/** Competitions this provider feeds (the canonical writer ensures them). */
export const FOOTBALL_COMPETITIONS = {
  'fifa-world-cup': { org: 'fifa', names: ['FIFA World Cup', 'Copa do Mundo FIFA', 'Copa Mundial de la FIFA'] },
  'fifa-womens-world-cup': { org: 'fifa', names: ["FIFA Women's World Cup", 'Copa do Mundo Feminina FIFA', 'Copa Mundial Femenina de la FIFA'] },
  'olympic-football': {
    org: 'ioc',
    names: ['Olympic football tournament (men)', 'Torneio olímpico de futebol (masculino)', 'Torneo olímpico de fútbol (masculino)'],
  },
  'olympic-football-women': {
    org: 'ioc',
    names: ['Olympic football tournament (women)', 'Torneio olímpico de futebol (feminino)', 'Torneo olímpico de fútbol (femenino)'],
  },
} as const;
