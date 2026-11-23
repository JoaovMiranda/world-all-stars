/** Assets of the document: client entry (+ dev preamble), stylesheets and module preloads (from the Vite manifest). */
export interface DocumentAssets {
  scripts: { attrs?: Record<string, string | boolean>; children?: string }[];
  css: string[];
  preloads: string[];
  /** Production: chunks of each page module (`src/modules/…page.tsx` → files), preloaded for the matched route. */
  routeChunks?: Record<string, string[]>;
}
