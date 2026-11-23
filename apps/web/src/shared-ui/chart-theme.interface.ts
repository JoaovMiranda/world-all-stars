import type { chartAxis, cssVar } from './chart-theme.helper';

export interface ChartTheme {
  cssVar: typeof cssVar;
  axis: typeof chartAxis;
}
