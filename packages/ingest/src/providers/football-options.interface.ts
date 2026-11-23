/** Options of the football-champions provider run. */
export interface FootballOptions {
  /** Restrict to some editions, e.g. ['fifa-world-cup:2002']. */
  only?: string[] | undefined;
  olympics?: boolean | undefined;
}
