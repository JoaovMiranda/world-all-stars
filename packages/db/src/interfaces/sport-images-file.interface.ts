import type { SportImage } from './sport-image.interface';
import type { SportImageMiss } from './sport-image-miss.interface';

/** Shape of data/content/sport-images.json, written by `pnpm ingest sport-images` and read by the seed. */
export interface SportImagesFile {
  generatedAt: string;
  source: string;
  images: SportImage[];
  missing: SportImageMiss[];
}
