// data/review/sport-images.md (T4.4 acceptance): sport → image, author, license, or why there is none.
import type { SportImagesFile } from '@was/db';

const cell = (s: string | null | undefined): string => (s ?? '—').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim() || '—';

/** Counts of the chosen images by license short name, most frequent first. */
export const licenseCounts = (file: SportImagesFile): [string, number][] => {
  const counts = new Map<string, number>();
  for (const i of file.images) counts.set(i.license, (counts.get(i.license) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};

/** Markdown review of a sport images run. */
export const sportImagesReview = (file: SportImagesFile): string => {
  const lines = [
    '# Sport images (T4.4)',
    '',
    `Generated ${file.generatedAt} by \`pnpm ingest sport-images\` from ${file.source}.`,
    'One Wikimedia Commons file per sport (Wikidata P18 of the sport item), linked only (never copied), shown through the',
    '`/img/wm` proxy with visible attribution. Allowed licenses: CC0, public domain, CC BY, CC BY-SA.',
    '',
    `- Sports with an image: ${file.images.length}`,
    `- Sports without an image: ${file.missing.length}`,
    ...licenseCounts(file).map(([license, n]) => `  - ${license}: ${n}`),
    '',
    '## Images',
    '',
    '| Sport | Image | Author | License |',
    '|---|---|---|---|',
    ...[...file.images]
      .sort((a, b) => a.sport.localeCompare(b.sport))
      .map(
        (i) =>
          `| ${i.sport} | [${cell(i.file)}](${i.page}) | ${cell(i.author)} | ${i.licenseUrl ? `[${cell(i.license)}](${i.licenseUrl})` : cell(i.license)} |`,
      ),
    '',
    '## No suitable image',
    '',
    '| Sport | Wikidata | Reason |',
    '|---|---|---|',
    ...[...file.missing].sort((a, b) => a.sport.localeCompare(b.sport)).map((m) => `| ${m.sport} | ${m.qid ?? '—'} | ${cell(m.reason)} |`),
    '',
  ];
  return lines.join('\n');
};
