/** One BJJ champion read from the ADCC / IBJJF Wikipedia tables. */
export interface BjjChampion {
  name: string;
  link: string | null;
  gender: 'men' | 'women';
  year: number | null;
  division: string;
}
