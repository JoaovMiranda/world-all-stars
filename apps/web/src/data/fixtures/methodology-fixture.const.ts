/**
 * Fixture mode (T4.2): the real METHODOLOGY.md files of `packages/ranking`, bundled as raw strings by Vite, keyed by
 * methodology (folder name). The server reads the same files from disk (dist/methodologies in production).
 */
export const FIXTURE_METHODOLOGY_SOURCES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../../../../../packages/ranking/src/methodologies/*/METHODOLOGY.md', { query: '?raw', import: 'default', eager: true }),
  ).map(([file, source]) => [file.split('/').at(-2) ?? file, source]),
);
