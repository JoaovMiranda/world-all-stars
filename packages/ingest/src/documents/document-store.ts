// Versioned documents, deduplicated payloads and observations (handoff v3 §5.3, B04/B05/C06).
// raw_hash = sha256 of the bytes received · normalized_hash = sha256 of the decoded text in NFC with \n line breaks
// and no BOM (JSON: canonical, sorted keys). Same URL + revision + normalized hash = same document (only
// last_seen_at moves). Different URLs with identical content = different documents sharing one payload.
// The body is stored only when the source's retention policy allows it.
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

import { active, type Database, sourceDocuments, sourceObservations, sourcePayloads, sources } from '@was/db';
import { uuidv7 } from '@was/shared';
import { and, eq, isNull } from 'drizzle-orm';

import type { ObservationInput } from './observation-input.interface';
import type { StoreDocumentInput } from './store-document-input.interface';

const sha256 = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');

/** Canonical JSON: sorted keys, no whitespace (stable hash of JSON payloads). */
export const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

/** Text normalization behind normalized_hash (charset decided by the caller from header → meta → UTF-8). */
export const normalizeText = (text: string): string => text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').normalize('NFC');

export const hashDocument = (bytes: Buffer, contentType: string | null, charset = 'utf-8') => {
  const text = normalizeText(new TextDecoder(charset).decode(bytes));
  let normalized = text;
  if (contentType?.includes('json')) {
    try {
      normalized = canonicalJson(JSON.parse(text));
    } catch {
      /* not valid JSON: hash the text */
    }
  }
  return { text, rawHash: sha256(bytes), normalizedHash: sha256(normalized) };
};

/** URL without fragment, default port or tracking params; host lower-cased. */
export const canonicalizeUrl = (raw: string): string => {
  const u = new URL(raw);
  u.hash = '';
  u.hostname = u.hostname.toLowerCase();
  for (const p of [...u.searchParams.keys()]) if (/^utm_/.test(p)) u.searchParams.delete(p);
  return u.href;
};

export const storeDocument = async (db: Database, input: StoreDocumentInput) => {
  const [source] = await db
    .select()
    .from(sources)
    .where(active(sources, eq(sources.slug, input.sourceSlug)));
  if (!source) throw new Error(`Unknown source ${input.sourceSlug}`);
  const { text, rawHash, normalizedHash } = hashDocument(input.bytes, input.contentType);
  const canonicalUrl = canonicalizeUrl(input.url);
  const now = new Date();
  const revisionMatch = input.revisionId === null ? isNull(sourceDocuments.revisionId) : eq(sourceDocuments.revisionId, input.revisionId);
  const [existing] = await db
    .select()
    .from(sourceDocuments)
    .where(active(sourceDocuments, and(eq(sourceDocuments.canonicalUrl, canonicalUrl), revisionMatch, eq(sourceDocuments.normalizedHash, normalizedHash))));
  if (existing) {
    await db.update(sourceDocuments).set({ lastSeenAt: now }).where(eq(sourceDocuments.id, existing.id));
    return { document: existing, text, isNew: false };
  }
  let body: string | null = null;
  let bodyKind = 'none';
  if (source.retentionPolicy === 'full_payload') {
    body = gzipSync(Buffer.from(text)).toString('base64');
    bodyKind = 'full';
  } else if (source.retentionPolicy === 'evidence_excerpts' && input.excerpts?.length) {
    body = gzipSync(Buffer.from(input.excerpts.join('\n\n'))).toString('base64');
    bodyKind = 'excerpts';
  }
  const [payloadRow] = await db
    .insert(sourcePayloads)
    .values({
      id: uuidv7(),
      createdVia: 'system:discovery',
      normalizedHash,
      contentType: input.contentType ?? 'text/plain',
      body,
      bodyKind,
      bytes: input.bytes.byteLength,
    })
    .onConflictDoNothing()
    .returning();
  const payload =
    payloadRow ??
    (
      await db
        .select()
        .from(sourcePayloads)
        .where(active(sourcePayloads, eq(sourcePayloads.normalizedHash, normalizedHash)))
    )[0];
  const [document] = await db
    .insert(sourceDocuments)
    .values({
      id: uuidv7(),
      createdVia: 'system:discovery',
      sourceId: source.id,
      url: input.url,
      canonicalUrl,
      revisionId: input.revisionId,
      fetchedAt: now,
      lastSeenAt: now,
      httpStatus: input.httpStatus,
      contentType: input.contentType,
      charset: 'utf-8',
      rawHash,
      normalizedHash,
      payloadId: payload?.id ?? null,
      licenseId: source.licenseId,
      jobId: input.jobId ?? null,
    })
    .returning();
  return { document: document!, text, isNew: true };
};

/** Idempotent by (document, parser, version, record key): re-parsing the same document never duplicates. */
export const recordObservation = async (db: Database, o: ObservationInput) => {
  const [row] = await db
    .insert(sourceObservations)
    .values({ id: uuidv7(), createdVia: 'system:discovery', ...o, observedAt: new Date(), confidence: o.confidence ?? 1 })
    .onConflictDoNothing()
    .returning();
  if (row) return { observation: row, isNew: true };
  const [found] = await db
    .select()
    .from(sourceObservations)
    .where(
      active(
        sourceObservations,
        and(
          eq(sourceObservations.documentId, o.documentId),
          eq(sourceObservations.parserKey, o.parserKey),
          eq(sourceObservations.parserVersion, o.parserVersion),
          eq(sourceObservations.recordKey, o.recordKey),
        ),
      ),
    );
  return { observation: found!, isNew: false };
};
