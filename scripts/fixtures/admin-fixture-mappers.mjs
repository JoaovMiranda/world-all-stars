// Admin fixtures (A1–A8) built from the prototype database. Where the prototype has no rows (privacy requests,
// pending AI proposals, a version-conflict example) a FEW clearly marked demo rows are generated here, never
// hand-written JSON: ids start with `demo-`, labels end with "(demo)".
import fs from 'node:fs';
import path from 'node:path';

import { mapRun } from './fixture-mappers.mjs';

const DEMO = '(demo)';
const DAY_MS = 86_400_000;
const iso = (s) => (s && !s.includes('T') ? `${s}T00:00:00.000Z` : s);
const SEED_ADMINS = ['Curador 1 (seed)', 'Curador 2 (seed)'];

/** Value of a dotted stats path (`stats.ufc_title_defenses`) in the athlete career stats. */
const statValue = (db, athleteId, field) => {
  const row = db.all('athlete_stats').find((s) => s.athlete_id === athleteId && s.period === 'career');
  const value = field.replace(/^stats\./, '').split('.').reduce((v, k) => (v && typeof v === 'object' ? v[k] : undefined), row?.stats);
  if (value === undefined || value === null) return null;
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

/** A1: base queue (conflicts + skipped AI items) + AI-extracted stats with evidence quote + demo pending items. */
export const mapAdminProposals = (db, sourceOf, baseProposals) => {
  const label = (id) => db.get('athletes', id)?.known_as ?? id;
  const ai = db
    .all('field_provenance')
    .filter((f) => f.extraction_method === 'ai' && f.evidence_quote && f.entity_type === 'athletes')
    .map((f) => {
      const value = statValue(db, f.entity_id, f.field_name);
      return {
        id: f.id,
        origin: 'ai_extraction',
        entity: { type: 'athletes', id: f.entity_id, label: label(f.entity_id) },
        field: f.field_name,
        base: null,
        current: value,
        proposed: value,
        source: sourceOf(f.source_link_id),
        evidenceQuote: f.evidence_quote,
        extractedByAi: true,
        model: f.model ?? null,
        status: 'approved',
        reviewNote: null,
        skippedAtGate: null,
        createdAt: iso(f.retrieved_at),
      };
    })
    .filter((p) => p.proposed !== null);
  // Demo: a few AI values re-proposed by a newer extraction (pending) + a version conflict for the 3-way diff.
  const demoAi = ai.filter((p) => /^\d+$/.test(p.current ?? '')).filter((_, i) => i % 11 === 3).slice(0, 4).map((p, i) => ({
    ...p,
    id: `demo-proposal-ai-${i + 1}`,
    entity: { ...p.entity, label: `${p.entity.label} ${DEMO}` },
    base: p.current,
    current: p.current,
    proposed: String(Number(p.current) + 1),
    status: 'pending',
    createdAt: '2026-11-03T04:00:00.000Z',
  }));
  const conflict = baseProposals.find((p) => p.origin === 'field_conflict');
  const demoConflict = conflict
    ? [{ ...conflict, id: 'demo-proposal-conflict-1', entity: { ...conflict.entity, label: `${conflict.entity.label} ${DEMO}` }, base: '180', status: 'pending', createdAt: '2026-11-03T05:00:00.000Z' }]
    : [];
  const base = baseProposals.map((p) => ({ ...p, base: p.current, model: null, reviewNote: null }));
  return { items: [...demoConflict, ...demoAi, ...base, ...ai] };
};

const logsOf = (run) => {
  const at = run.startedAt;
  const lines = [{ at, level: 'info', message: `${run.checked} link(s) verificados (${run.mode})` }];
  if (run.unchanged) lines.push({ at, level: 'info', message: `${run.unchanged} sem mudança: portão "sem mudança", 0 tokens` });
  if (run.updated) lines.push({ at, level: 'info', message: `${run.updated} atualizado(s)` });
  if (run.errors) lines.push({ at, level: 'error', message: `${run.errors} erro(s) de parser` });
  if (run.tokens) lines.push({ at, level: 'info', message: `${run.tokens} tokens do extrator` });
  return lines;
};

/** A2: runs (prototype ingestion_runs + the AI extraction batches of mock/ingest/extractor-usage.json) and the AI queue. */
export const mapAdminIngestion = (db, mockDir) => {
  const queue = db.all('ai_extraction_queue');
  const linkSource = (linkId) => db.get('sources', db.get('source_links', linkId)?.source_id ?? '');
  const runs = db.all('ingestion_runs').map((r) => {
    const s = db.get('sources', r.source_id);
    const run = mapRun(r);
    const skippedHere = queue.filter((q) => q.skipped_at_gate && linkSource(q.source_link_id)?.id === r.source_id);
    const skipped = { unchanged: run.unchanged, noise: 0, parser: run.errors, duplicate: 0, budget: 0 };
    return { ...run, source: s ? { slug: s.slug, name: s.name } : null, skipped, tokens: 0, _queue: skippedHere };
  });
  // Each skipped queue item counts once, on the latest run of its source.
  const seen = new Set();
  for (const run of [...runs].sort((a, b) => b.startedAt.localeCompare(a.startedAt))) {
    for (const q of run._queue) if (!seen.has(q.id) && q.skipped_at_gate in run.skipped) (seen.add(q.id), run.skipped[q.skipped_at_gate]++);
  }
  const usageFile = path.join(mockDir, 'ingest/extractor-usage.json');
  const usage = fs.existsSync(usageFile) ? JSON.parse(fs.readFileSync(usageFile, 'utf8')) : {};
  const batches = Object.entries(usage).map(([key, u], i) => {
    const n = (u.athletes ?? []).length;
    const startedAt = new Date(Date.parse('2026-11-04T02:00:00.000Z') + i * 600_000).toISOString();
    return {
      id: `ai-batch-${key}`, jobKey: `ai.extraction · ${key}`, mode: 'manual', startedAt,
      finishedAt: new Date(Date.parse(startedAt) + (u.duration_ms ?? 0)).toISOString(), status: 'success',
      checked: n, unchanged: 0, updated: n, errors: 0, source: null,
      skipped: { unchanged: 0, noise: 0, parser: 0, duplicate: 0, budget: 0 }, tokens: u.tokens ?? 0,
    };
  });
  const all = [...runs.map(({ _queue, ...r }) => r), ...batches]
    .map((r) => ({ ...r, logs: logsOf(r) }))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const label = (linkId) => {
    const l = db.get('source_links', linkId);
    return (l?.entity_type === 'athletes' ? db.get('athletes', l.entity_id)?.known_as : null) ?? l?.url ?? linkId;
  };
  return {
    runs: all,
    queue: queue.map((q) => ({
      id: q.id, entityLabel: label(q.source_link_id), section: q.section_key, sourceName: linkSource(q.source_link_id)?.name ?? null,
      status: q.status, skippedAtGate: q.skipped_at_gate ?? null, tokensIn: q.tokens_in ?? 0, tokensOut: q.tokens_out ?? 0,
      model: q.model ?? null, createdAt: iso(q.created_at),
    })),
  };
};

/** A6: dossiers of the prototype (2 seed approvals) + the "awaiting 2nd approval" example of mock/ingest/admin-review.json. */
export const mapAdminDossiers = (db, sourceOf, athleteRef, mockDir) => {
  const tr = (table, col, id) => db.all(table).find((t) => t[col] === id && t.locale === 'pt-BR') ?? db.all(table).find((t) => t[col] === id);
  const items = db.all('greats_dossiers').map((d) => ({
    id: d.id,
    athlete: athleteRef(d.athlete_id),
    headline: tr('greats_dossier_translations', 'dossier_id', d.id)?.headline ?? '',
    status: d.status,
    approvalsRequired: d.approvals_required,
    approvedBy: SEED_ADMINS.slice(0, d.approvals_count),
    reviewNote: null,
    evidences: db.all('greats_evidences').filter((e) => e.dossier_id === d.id).map((e) => ({
      id: e.id, type: e.evidence_type, description: tr('greats_evidence_translations', 'evidence_id', e.id)?.description ?? null, source: sourceOf(e.source_link_id),
    })),
    updatedAt: iso(d.updated_at),
  }));
  const reviewFile = path.join(mockDir, 'ingest/admin-review.json');
  const review = fs.existsSync(reviewFile) ? JSON.parse(fs.readFileSync(reviewFile, 'utf8')) : {};
  for (const [slug, decision] of Object.entries(review)) {
    const athlete = db.all('athletes').find((a) => a.slug === slug);
    if (!athlete || items.some((d) => d.athlete.slug === slug)) continue;
    const quotes = db.all('field_provenance').filter((f) => f.entity_id === athlete.id && f.evidence_quote).slice(0, 3);
    items.push({
      id: `demo-dossier-${slug}`,
      athlete: athleteRef(athlete.id),
      headline: `${athlete.known_as}: proposta de Mítico ${DEMO}`,
      status: 'pending',
      approvalsRequired: 2,
      approvedBy: SEED_ADMINS.slice(0, 1),
      reviewNote: decision.note ?? null,
      evidences: quotes.map((f, i) => ({ id: `demo-evidence-${slug}-${i + 1}`, type: i === 0 ? 'decades_record' : 'institutional_recognition', description: f.evidence_quote, source: sourceOf(f.source_link_id) })),
      updatedAt: '2026-11-04T00:00:00.000Z',
    });
  }
  return { items: items.sort((a, b) => (a.status === 'pending' ? -1 : 0) - (b.status === 'pending' ? -1 : 0)) };
};

/** A4: accounts of the prototype + audit log from the tier history. */
export const mapAdminUsers = (db, adminName) => ({
  items: db.all('users').map((u) => ({
    id: u.id, name: u.display_name, email: u.email, role: u.role, bannedAt: null, banReason: null,
    tierVotesCount: u.tier_votes_count ?? 0, commentsCount: u.comments_count ?? 0, createdAt: iso(u.created_at),
  })),
  audit: db.all('athlete_tier_history').map((h) => ({
    id: h.id, at: iso(h.decided_at), actor: adminName, action: 'tier_changed', target: db.get('athletes', h.athlete_id)?.known_as ?? h.athlete_id, reason: h.reason ?? null,
  })),
});

/** A5: the prototype has no privacy_requests rows → a few demo requests (fake e-mails, "(demo)" details). */
export const demoPrivacyRequests = (athleteRef, db) => {
  const pele = db.all('athletes').find((a) => a.slug === 'pele');
  const rows = [
    { subjectKind: 'user', right: 'access', createdAt: '2026-10-28T10:00:00.000Z', status: 'open', details: 'Quero uma cópia dos meus votos e comentários.' },
    { subjectKind: 'heir', right: 'correction', createdAt: '2026-10-20T14:30:00.000Z', status: 'in_progress', details: 'Herdeiro pede correção da data de um título.', athlete: pele },
    { subjectKind: 'user', right: 'deletion', createdAt: '2026-10-10T09:00:00.000Z', status: 'in_progress', details: 'Excluir minha conta e anonimizar meus comentários.' },
    { subjectKind: 'other', right: 'opposition', createdAt: '2026-11-02T16:00:00.000Z', status: 'open', details: 'Oposição ao uso de uma foto em um perfil.' },
    { subjectKind: 'user', right: 'portability', createdAt: '2026-10-01T08:00:00.000Z', status: 'answered', details: 'Exportar meus dados em JSON.' },
  ];
  return {
    items: rows.map((r, i) => ({
      id: `demo-privacy-${i + 1}`,
      protocol: `PRV-${String(100001 + i)}`,
      requesterEmail: `titular${i + 1}.demo@exemplo.invalid`,
      subjectKind: r.subjectKind,
      right: r.right,
      athlete: r.athlete ? athleteRef(r.athlete.id) : null,
      details: `${r.details} ${DEMO}`,
      status: r.status,
      createdAt: r.createdAt,
      dueAt: new Date(Date.parse(r.createdAt) + 15 * DAY_MS).toISOString(),
      answeredAt: r.status === 'answered' ? new Date(Date.parse(r.createdAt) + 5 * DAY_MS).toISOString() : null,
      handledBy: r.status === 'open' ? null : SEED_ADMINS[0],
      note: r.status === 'answered' ? 'Arquivo enviado por e-mail.' : null,
    })),
  };
};
