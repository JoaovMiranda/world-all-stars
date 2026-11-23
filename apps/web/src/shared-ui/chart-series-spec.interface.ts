/** One slice/series with its color as a CSS token name (`--success`, `--medal-gold`). */
export interface ChartSeriesSpec {
  name: string;
  data: readonly number[];
  color: string;
}
