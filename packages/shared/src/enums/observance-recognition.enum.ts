/** Who recognizes an observance day. */
export const ObservanceRecognition = {
  UnResolution: 'un_resolution',
  Federation: 'federation',
  Tradition: 'tradition',
} as const;
export type ObservanceRecognition = (typeof ObservanceRecognition)[keyof typeof ObservanceRecognition];
export const OBSERVANCE_RECOGNITION_VALUES = Object.values(ObservanceRecognition) as [ObservanceRecognition, ...ObservanceRecognition[]];
