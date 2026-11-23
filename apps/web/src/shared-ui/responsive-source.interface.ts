export interface ResponsiveSource {
  src: string;
  srcSet?: string;
  sizes?: string;
  /** The untouched URL, used when the thumbnail fails (e.g. a file narrower than the step). */
  fallback?: string;
}
