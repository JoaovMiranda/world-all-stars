// Fixture mode of the merge screen (D14): candidates and preview from the sample athletes; merges live in memory.
import type { MergeCandidate, MergeCandidatesResponse, MergeHistoryItem, MergeHistoryResponse, MergePreviewResponse, MergeRequest } from '@was/shared';

import { demoId } from '../demo.store';
import type { loadSample } from '../sample-fixtures.helper';

type Sample = typeof loadSample;

const history: MergeHistoryItem[] = [];

const sampleCandidates = async (sample: Sample): Promise<MergeCandidate[]> =>
  (await sample('athletes.json')).items.map((a) => ({ id: a.id, slug: a.slug, name: a.knownAs }));

const merged = () => new Set(history.filter((h) => !h.undoneAt).map((h) => h.merged.id));

export const buildMergeCandidates = async (sample: Sample, q?: string): Promise<MergeCandidatesResponse> => {
  const term = q?.trim().toLowerCase() ?? '';
  const gone = merged();
  const items = (await sampleCandidates(sample)).filter((c) => !gone.has(c.id) && (!term || c.name.toLowerCase().includes(term) || c.slug.includes(term)));
  return { items: items.slice(0, 20) };
};

export const buildMergePreview = async (sample: Sample, survivorId: string, mergedId: string): Promise<MergePreviewResponse> => {
  const all = await sampleCandidates(sample);
  const fallback = (id: string): MergeCandidate => ({ id, slug: id, name: id });
  const survivor = all.find((c) => c.id === survivorId) ?? fallback(survivorId);
  const other = all.find((c) => c.id === mergedId) ?? fallback(mergedId);
  const value = (v: string | null) => ({ value: v, source: 'seed' });
  return {
    survivor,
    merged: other,
    fields: [
      { field: 'knownAs', survivor: value(survivor.name), merged: value(other.name) },
      { field: 'slug', survivor: value(survivor.slug), merged: value(other.slug) },
      { field: 'fullName', survivor: value(null), merged: value(null) },
    ],
  };
};

export const recordDemoMerge = async (sample: Sample, body: Pick<MergeRequest, 'survivorId' | 'mergedId' | 'reason'>): Promise<{ id: string }> => {
  const all = await sampleCandidates(sample);
  const side = (id: string) => all.find((c) => c.id === id) ?? { id, slug: id, name: id };
  const id = demoId();
  history.unshift({
    id,
    survivor: side(body.survivorId),
    merged: side(body.mergedId),
    reason: body.reason,
    mergedAt: new Date().toISOString(),
    undoneAt: null,
    undoReason: null,
    moved: 0,
  });
  return { id };
};

export const undoDemoMerge = (id: string, reason: string) => {
  const item = history.find((h) => h.id === id);
  if (item && !item.undoneAt) Object.assign(item, { undoneAt: new Date().toISOString(), undoReason: reason });
  return { ok: true } as const;
};

export const buildMergeHistory = (): MergeHistoryResponse => ({ items: [...history] });
