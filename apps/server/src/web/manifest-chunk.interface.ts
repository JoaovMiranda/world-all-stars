/** One entry of the Vite client manifest (dist/client/.vite/manifest.json). */
export interface ManifestChunk {
  file: string;
  src?: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  css?: string[];
}
