/** Same shape as `DocumentAssets` of apps/web/src/app/entry-server.tsx (root route of the router manifest). */
export interface DocumentAssets {
  scripts: { attrs?: Record<string, string | boolean>; children?: string }[];
  css: string[];
  preloads: string[];
  routeChunks?: Record<string, string[]>;
}
