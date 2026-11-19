/** Which value of a metric is better. */
export const MetricDirection = {
  Lower: 'lower',
  Higher: 'higher',
  None: 'none',
} as const;
export type MetricDirection = (typeof MetricDirection)[keyof typeof MetricDirection];
export const METRIC_DIRECTION_VALUES = Object.values(MetricDirection) as [MetricDirection, ...MetricDirection[]];
