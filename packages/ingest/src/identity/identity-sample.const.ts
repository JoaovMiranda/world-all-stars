// Labelled identity sample (handoff v3 §7.1, D01): known and ambiguous pairs drawn from the real sources —
// homonyms, married names, accents and transliteration, historical teams, legacy athletes. `same` is the truth.
import type { IdentityQuery } from './identity-query.interface';
import type { IdentitySampleCandidate as Candidate } from './identity-sample-candidate.interface';
import type { IdentitySampleCase } from './identity-sample-case.interface';

const P = (names: string[], externalIds: Record<string, string> = {}, sports: string[] = ['football'], birthDate: string | null = null): Candidate => ({
  names,
  externalIds,
  sports,
  birthDate,
});
const Q = (name: string, externalIds: Record<string, string> = {}, sport: string | null = 'football', birthDate: string | null = null): IdentityQuery => ({
  name,
  externalIds,
  sport,
  birthDate,
});

export const IDENTITY_SAMPLE: IdentitySampleCase[] = [
  // Same person, strong ids.
  { label: 'Pelé: Wikipedia title', same: true, query: Q('Pelé', { wikipedia_en: 'Pelé' }), candidate: P(['Pelé'], { wikipedia_en: 'Pelé' }) },
  { label: 'Ronaldo: Fjelstul id', same: true, query: Q('Ronaldo', { fjelstul: 'P-01234' }), candidate: P(['Ronaldo Nazário'], { fjelstul: 'P-01234' }) },
  { label: 'Marta: Wikidata', same: true, query: Q('Marta', { wikidata: 'Q221' }), candidate: P(['Marta Vieira da Silva'], { wikidata: 'Q221' }) },
  {
    label: 'Roger Gracie: title',
    same: true,
    query: Q('Roger Gracie', { wikipedia_en: 'Roger Gracie' }, 'jiu-jitsu'),
    candidate: P(['Roger Gracie'], { wikipedia_en: 'Roger Gracie' }, ['jiu-jitsu']),
  },
  {
    label: 'Xande Ribeiro (alias) → Alexandre Ribeiro',
    same: true,
    query: Q('Xande Ribeiro', { wikipedia_en: 'Alexandre Ribeiro' }, 'jiu-jitsu'),
    candidate: P(['Alexandre Ribeiro', 'Xande'], { wikipedia_en: 'Alexandre Ribeiro' }, ['jiu-jitsu']),
  },
  {
    label: 'Cobrinha: title with accents/case',
    same: true,
    query: Q('Rubens Charles', { wikipedia_en: 'Rubens Charles Maciel' }, 'jiu-jitsu'),
    candidate: P(['Rubens Charles Maciel'], { wikipedia_en: 'rubens charles maciel' }, ['jiu-jitsu']),
  },
  {
    label: 'Accents: Mário vs Mario Sperry',
    same: true,
    query: Q('Mário Sperry', { wikipedia_en: 'Mario Sperry' }, 'jiu-jitsu'),
    candidate: P(['Mario Sperry'], { wikipedia_en: 'Mario Sperry' }, ['jiu-jitsu']),
  },
  {
    label: 'Jean-Jacques vs Jean Jacques (title)',
    same: true,
    query: Q('Jean-Jacques Machado', { wikipedia_en: 'Jean Jacques Machado' }, 'jiu-jitsu'),
    candidate: P(['Jean Jacques Machado'], { wikipedia_en: 'Jean Jacques Machado' }, ['jiu-jitsu']),
  },
  {
    label: 'Married name with birth date and sport',
    same: true,
    query: Q('Abby Wambach', {}, 'football', '1980-06-02'),
    candidate: P(['Mary Abigail Wambach'], {}, ['football'], '1980-06-02'),
  },
  {
    label: 'Transliteration: Lev Yashin (same birth)',
    same: true,
    query: Q('Lev Yashin', {}, 'football', '1929-10-22'),
    candidate: P(['Lev Yashin', 'Лев Яшин'], {}, ['football'], '1929-10-22'),
  },
  {
    label: 'West Germany 1974 player via Fjelstul id',
    same: true,
    query: Q('Franz Beckenbauer', { fjelstul: 'P-00001' }),
    candidate: P(['Franz Beckenbauer'], { fjelstul: 'P-00001' }),
  },
  { label: 'USSR 1956 player: same name + sport (no ids) → review', same: true, query: Q('Igor Netto'), candidate: P(['Igor Netto']) },
  {
    label: 'Mazelli vs Mazzelli (spelling) → review by sport',
    same: true,
    query: Q('Fernanda Mazelli', {}, 'jiu-jitsu'),
    candidate: P(['Fernanda Mazelli'], {}, ['jiu-jitsu']),
  },
  {
    label: 'Squad name vs final-page name (same title)',
    same: true,
    query: Q('Cafu', { wikipedia_en: 'Cafu' }),
    candidate: P(['Marcos Evangelista de Morais'], { wikipedia_en: 'Cafu' }),
  },
  {
    label: 'Legacy athlete Neymar by title',
    same: true,
    query: Q('Neymar', { wikipedia_en: 'Neymar' }),
    candidate: P(['Neymar'], { wikipedia_en: 'Neymar', rsssf: 'neymar' }),
  },
  // Different people.
  {
    label: 'Homonyms: Ronaldo (Brazil) vs Cristiano Ronaldo',
    same: false,
    query: Q('Ronaldo', { wikipedia_en: 'Ronaldo (Brazilian footballer)' }),
    candidate: P(['Ronaldo'], { wikipedia_en: 'Cristiano Ronaldo' }),
  },
  {
    label: 'Homonyms: two Marcelo Garcia (grappler vs footballer)',
    same: false,
    query: Q('Marcelo Garcia', { wikipedia_en: 'Marcelo Garcia (grappler)' }, 'jiu-jitsu'),
    candidate: P(['Marcelo Garcia'], { wikipedia_en: 'Marcelo Garcia (footballer)' }),
  },
  {
    label: 'Homonyms: Rafael Mendes (BJJ) vs footballer, no ids',
    same: false,
    query: Q('Rafael Mendes', {}, 'jiu-jitsu'),
    candidate: P(['Rafael Mendes'], {}, ['football']),
  },
  { label: 'Same name, different Fjelstul ids', same: false, query: Q('Ronaldinho', { fjelstul: 'P-10' }), candidate: P(['Ronaldinho'], { fjelstul: 'P-11' }) },
  {
    label: 'Same name, different birth dates',
    same: false,
    query: Q('Juninho', {}, 'football', '1975-01-22'),
    candidate: P(['Juninho'], {}, ['football'], '1973-02-22'),
  },
  { label: 'Same name, other sport, no ids', same: false, query: Q('Orlando Sanchez', {}, 'jiu-jitsu'), candidate: P(['Orlando Sanchez'], {}, ['boxing']) },
  { label: 'Different Wikidata items', same: false, query: Q('Marta', { wikidata: 'Q221' }), candidate: P(['Marta'], { wikidata: 'Q999999' }) },
  { label: 'Team renamed: not a person match', same: false, query: Q('SK Telecom T1'), candidate: P(['T1'], {}, ['league-of-legends']) },
  { label: 'Different names', same: false, query: Q('Gordon Ryan', {}, 'jiu-jitsu'), candidate: P(['Nicky Ryan'], {}, ['jiu-jitsu']) },
];
