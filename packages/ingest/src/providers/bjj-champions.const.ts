/** Provider key of the ADCC / World IBJJF champions. */
export const BJJ_PROVIDER = 'bjj-champions';

/** Competitions this provider feeds (the canonical writer ensures them). */
export const BJJ_COMPETITIONS = {
  adcc: {
    org: 'adcc',
    gi: 'no-gi',
    names: ['ADCC Submission Fighting World Championship', 'Mundial ADCC de Submission Fighting', 'Campeonato Mundial ADCC de Submission Fighting'],
  },
  'ibjjf-world-championship': {
    org: 'ibjjf',
    gi: 'gi',
    names: ['World IBJJF Jiu-Jitsu Championship', 'Campeonato Mundial de Jiu-Jitsu (IBJJF)', 'Campeonato Mundial de Jiu-Jitsu (IBJJF)'],
  },
} as const;

/** The user's list (aliases → Wikipedia titles used by the ADCC/IBJJF tables); kept even if the parser misses one. */
export const USER_BJJ: [name: string, title: string | null, nickname?: string][] = [
  ['André Galvão', 'André Galvão'],
  ['Baret Yoshida', null],
  ['Braulio Estima', 'Braulio Estima'],
  ['Dean Lister', 'Dean Lister'],
  ['Fabrício Werdum', 'Fabrício Werdum'],
  ['Jean-Jacques Machado', 'Jean Jacques Machado'],
  ['Marcelo Garcia', 'Marcelo Garcia (grappler)'],
  ['Mark Kerr', 'Mark Kerr (fighter)'],
  ['Mário Sperry', 'Mario Sperry'],
  ['Orlando Sanchez', 'Orlando Sanchez (grappler)'],
  ['Rafael Mendes', 'Rafael Mendes'],
  ['Ricardo Arona', 'Ricardo Arona'],
  ['Ronaldo Jacaré Souza', 'Ronaldo Souza', 'Jacaré'],
  ['Renzo Gracie', 'Renzo Gracie'],
  ['Roger Gracie', 'Roger Gracie'],
  ['Royler Gracie', 'Royler Gracie'],
  ['Rubens Charles Maciel', 'Rubens Charles Maciel', 'Cobrinha'],
  ['Saulo Ribeiro', 'Saulo Ribeiro'],
  ['Vinny Magalhães', 'Vinny Magalhães'],
  ['Xande Ribeiro', 'Alexandre Ribeiro', 'Xande'],
  ['Kyra Gracie', 'Kyra Gracie'],
];
