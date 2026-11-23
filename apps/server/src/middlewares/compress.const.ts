/** Text-like bodies worth compressing (HTML, JSON, JS, CSS, SVG, XML). Images/fonts are already compressed. */
export const COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml|manifest\+json|ld\+json)|image\/svg\+xml)/i;
/** Below this, the headers cost more than the bytes saved. Unknown length (streamed SSR) is always compressed. */
export const MIN_BYTES = 1024;
