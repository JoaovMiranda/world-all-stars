/** Value type of a metric definition (result-agnostic, §4.4). */
export const MetricValueType = {
  Duration: 'duration',
  Distance: 'distance',
  Mass: 'mass',
  Points: 'points',
  Count: 'count',
  Rating: 'rating',
  Score: 'score',
  Text: 'text',
  Boolean: 'boolean',
} as const;
export type MetricValueType = (typeof MetricValueType)[keyof typeof MetricValueType];
export const METRIC_VALUE_TYPE_VALUES = Object.values(MetricValueType) as [MetricValueType, ...MetricValueType[]];
