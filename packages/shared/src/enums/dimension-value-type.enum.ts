/** How the values of a category dimension are expressed (§4.2). */
export const DimensionValueType = {
  Ordinal: 'ordinal',
  NumericRange: 'numeric_range',
  Label: 'label',
} as const;
export type DimensionValueType = (typeof DimensionValueType)[keyof typeof DimensionValueType];
export const DIMENSION_VALUE_TYPE_VALUES = Object.values(DimensionValueType) as [DimensionValueType, ...DimensionValueType[]];
