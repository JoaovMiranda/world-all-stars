import { useQuery } from '@tanstack/react-query';
import type { Feature, Geometry } from 'geojson';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';

export type CountryFeature = Feature<Geometry, { name: string }>;

/** Loads Natural Earth 1:110m countries (world-atlas) lazily, as its own chunk, once per session. */
const loadCountries = async (): Promise<CountryFeature[]> => {
  const atlas = (await import('world-atlas/countries-110m.json')).default as unknown as Topology<{
    countries: GeometryCollection<{ name: string }>;
  }>;
  return feature(atlas, atlas.objects.countries).features as CountryFeature[];
};

export const useWorldAtlas = () =>
  useQuery({ queryKey: ['world-atlas', '110m'], queryFn: loadCountries, staleTime: Infinity, gcTime: Infinity, retry: 1 });
