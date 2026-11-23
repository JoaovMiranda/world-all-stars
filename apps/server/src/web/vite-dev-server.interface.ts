import type { IncomingMessage, ServerResponse } from 'node:http';

/** The part of Vite's ViteDevServer used here (vite is a dependency of apps/web, resolved from there). */
export interface ViteDevServer {
  middlewares: (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => void;
  ssrLoadModule(url: string): Promise<Record<string, unknown>>;
  ssrFixStacktrace(error: Error): void;
  transformIndexHtml(url: string, html: string): Promise<string>;
  environments: { ssr: { moduleGraph: { idToModuleMap: Map<string, { id: string | null; url: string }> } } };
  close(): Promise<void>;
}
