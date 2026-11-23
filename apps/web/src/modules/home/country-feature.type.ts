import type { Feature, Geometry } from 'geojson';

export type CountryFeature = Feature<Geometry, { name: string }>;
