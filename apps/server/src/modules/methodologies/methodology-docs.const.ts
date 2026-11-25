import { MethodologyDocsStore } from './methodology-docs.store';
import { resolveMethodologyDocsDir } from './methodology-docs-dir.helper';

/** Every METHODOLOGY.md, parsed when the server starts (the route module imports this at boot). */
export const METHODOLOGY_DOCS = new MethodologyDocsStore(resolveMethodologyDocsDir());
