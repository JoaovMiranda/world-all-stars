import { API_ERROR_MESSAGES, type AddCollectionLinksRequest, type AdminAuditAction, AdminAuditAction as Audit, type AdminDecision, AdminDecision as Decision, type AdminSummaryResponse, type BannedWord, type ContactStatus, type FieldErrors, IngestionRunStatus, PrivacyRequestStatus, type PrivacyRequestStatus as PrivacyStatus, ReviewStatus, SuggestionStatus, type TierSignal, type UpdateSourceRequest, type UpdateUserRequest, adminPendingCounts, checkSourceUrl, reviewDossierOutcome, tierSignalOf } from '@was/shared';
import { currentText } from '@/i18n/text-for.helper';
import { localeStore } from '@/i18n/locale.store';

import { ApiError } from '../api-error.error';
import { demoId, demoStore } from '../demo.store';
import type { loadSample } from '../sample-fixtures.helper';
import { type AdminDemoState, initialAdminDemo } from './admin-demo.type';
import { requireUser } from './require-user.fixture';
import { buildTierVotes } from './tier-votes.fixture';

type Sample = typeof loadSample;
type Session = Parameters<typeof requireUser>[0];

const now = () => new Date().toISOString();
const ok = { ok: true } as const;
const wordKey = (w: Pick<BannedWord, 'locale' | 'term'>) => `${w.locale}:${w.term.toLowerCase()}`;
const invalid = (message: string, errors?: FieldErrors) => new ApiError(422, { error: 'validation', message, ...(errors ? { errors } : {}) });

/** Admin decisions of the demo, with defaults for keys added after the state was saved. */
const adminDemo = (): AdminDemoState => ({ ...initialAdminDemo(), ...demoStore.get().admin });

/** Applies an admin decision and records it in the audit log (A4), like the API would in one transaction. */
const decide = (session: Session, entry: { action: AdminAuditAction; target: string; reason: string | null }, recipe: (a: AdminDemoState) => void) => {
  const actor = requireUser(session).name;
  demoStore.update((d) => {
    d.admin = { ...initialAdminDemo(), ...d.admin };
    recipe(d.admin);
    d.admin.audit.unshift({ id: demoId(), at: now(), actor, ...entry });
  });
  return ok;
};

// ── A1 · proposals and tier signals ──
export const buildProposals = async (sample: Sample) => {
  const { proposals } = adminDemo();
  const base = await sample('admin-proposals.json');
  return { items: base.items.map((p) => (proposals[p.id] ? { ...p, status: proposals[p.id]!.status, reviewNote: proposals[p.id]!.reason } : p)) };
};

export const reviewDemoProposal = async (sample: Sample, session: Session, id: string, decision: AdminDecision, reason: string) => {
  const item = (await buildProposals(sample)).items.find((p) => p.id === id);
  if (!item) throw new ApiError(404, { error: 'not_found' });
  if (item.status !== ReviewStatus.Pending) throw invalid(currentText(API_ERROR_MESSAGES).proposalDecided);
  const approve = decision === Decision.Approve;
  return decide(session, { action: approve ? Audit.ProposalApproved : Audit.ProposalRejected, target: `${item.entity.label} · ${item.field}`, reason }, (a) => {
    a.proposals[id] = { status: approve ? ReviewStatus.Approved : ReviewStatus.Rejected, reason };
  });
};

export const buildTierSignals = async (sample: Sample): Promise<{ items: TierSignal[] }> => {
  const { items } = await sample('athletes.json');
  const rows = await Promise.all(
    items.map(async (a) => {
      const votes = await buildTierVotes(sample, a.slug);
      return { athlete: { slug: a.slug, knownAs: a.knownAs, tier: votes.official }, official: votes.official, counts: votes.counts, total: votes.total, ...tierSignalOf(votes.counts, votes.official) };
    }),
  );
  return { items: rows.sort((x, y) => Number(y.isSignal) - Number(x.isSignal) || y.topOtherShare - x.topOtherShare) };
};

// ── A2 · ingestion ──
export const buildIngestion = async (sample: Sample) => {
  const base = await sample('admin-ingestion.json');
  return { ...base, runs: [...adminDemo().runs, ...base.runs] };
};

export const runDemoIngestion = async (sample: Sample, session: Session, jobKey: string) => {
  const last = (await buildIngestion(sample)).runs.find((r) => r.jobKey === jobKey);
  if (!last) throw new ApiError(404, { error: 'not_found' });
  const at = now();
  // Simulated incremental run: nothing changed upstream, so every link stops at the "unchanged" gate (0 tokens).
  const run = {
    ...last,
    id: demoId(),
    mode: 'manual',
    startedAt: at,
    finishedAt: at,
    status: IngestionRunStatus.Success,
    unchanged: last.checked,
    updated: 0,
    errors: 0,
    skipped: { unchanged: last.checked, noise: 0, parser: 0, duplicate: 0, budget: 0 },
    tokens: 0,
    logs: [
      { at, level: 'info' as const, message: `${last.checked} link(s) verificados (manual, simulado)` },
      { at, level: 'info' as const, message: `${last.checked} sem mudança: portão "sem mudança", 0 tokens` },
    ],
  };
  return decide(session, { action: Audit.IngestionTriggered, target: jobKey, reason: null }, (a) => {
    a.runs.unshift(run);
  });
};

// ── A3 · sources and collection links ──
export const buildSources = async (sample: Sample) => {
  const { sources, queuedLinks } = adminDemo();
  const base = await sample('sources.json');
  return {
    sources: base.map((s) => ({ ...s, usageStatus: sources[s.slug]?.usageStatus ?? s.usageStatus, licenseReviewedAt: sources[s.slug]?.licenseReviewedAt ?? null })),
    queuedLinks,
  };
};

export const updateDemoSource = async (sample: Sample, session: Session, slug: string, body: UpdateSourceRequest) => {
  const source = (await sample('sources.json')).find((s) => s.slug === slug);
  if (!source) throw new ApiError(404, { error: 'not_found' });
  return decide(session, { action: Audit.SourceUpdated, target: source.name, reason: body.reason }, (a) => {
    const prev = a.sources[slug] ?? {};
    a.sources[slug] = {
      ...prev,
      ...(body.usageStatus ? { usageStatus: body.usageStatus } : {}),
      ...(body.licenseReviewed !== undefined ? { licenseReviewedAt: body.licenseReviewed ? now() : null } : {}),
    };
  });
};

/** Re-checks every link with the shared anti-SSRF/registry rules (same as the server before any crawl). */
const queueLinks = async (sample: Sample, athleteName: string, sport: string | null, urls: readonly string[], origin: 'admin' | 'suggestion') => {
  const { sources } = await sample('validation-context.json');
  const errors: FieldErrors = {};
  const checked = urls.map((url, i) => {
    const r = checkSourceUrl(url, sources, localeStore.get());
    if (!r.ok) errors[`urls.${i}`] = r.message;
    return r;
  });
  if (Object.keys(errors).length) throw invalid(currentText(API_ERROR_MESSAGES).invalidLinks, errors);
  const at = now();
  return checked.flatMap((r) => (r.ok ? [{ id: demoId(), athleteName, sport, url: r.url, sourceName: r.source?.name ?? null, origin, createdAt: at }] : []));
};

export const addDemoCollectionLinks = async (sample: Sample, session: Session, body: AddCollectionLinksRequest) => {
  const links = await queueLinks(sample, body.athleteName, body.sport ?? null, body.urls, 'admin');
  return decide(session, { action: Audit.LinksQueued, target: body.athleteName, reason: null }, (a) => {
    a.queuedLinks.unshift(...links);
  });
};

// ── A4 · users and audit ──
export const buildUsers = async (sample: Sample) => {
  const { users, audit } = adminDemo();
  const base = await sample('admin-users.json');
  return { items: base.items.map((u) => ({ ...u, ...users[u.id] })), audit: [...audit, ...base.audit] };
};

export const updateDemoUser = async (sample: Sample, session: Session, id: string, body: UpdateUserRequest) => {
  const target = (await buildUsers(sample)).items.find((u) => u.id === id);
  if (!target) throw new ApiError(404, { error: 'not_found' });
  if (target.email === requireUser(session).email) throw invalid(currentText(API_ERROR_MESSAGES).ownAccount);
  const action = body.role ? Audit.RoleChanged : body.banned ? Audit.UserBanned : Audit.UserUnbanned;
  return decide(session, { action, target: target.name, reason: body.reason }, (a) => {
    const prev = a.users[id] ?? {};
    a.users[id] = {
      ...prev,
      ...(body.role ? { role: body.role } : {}),
      ...(body.banned !== undefined ? { bannedAt: body.banned ? now() : null, banReason: body.banned ? body.reason : null } : {}),
    };
  });
};

// ── A5 · privacy requests ──
export const buildPrivacy = async (sample: Sample) => {
  const { privacy } = adminDemo();
  const base = await sample('admin-privacy.json');
  const closed = (s: PrivacyStatus) => s === PrivacyRequestStatus.Answered || s === PrivacyRequestStatus.Rejected;
  return {
    items: base.items.map((r) => {
      const o = privacy[r.id];
      return o ? { ...r, status: o.status, note: o.note, handledBy: o.by, answeredAt: closed(o.status) ? o.at : null } : r;
    }),
  };
};

export const updateDemoPrivacy = async (sample: Sample, session: Session, id: string, status: PrivacyStatus, note: string) => {
  const item = (await buildPrivacy(sample)).items.find((r) => r.id === id);
  if (!item) throw new ApiError(404, { error: 'not_found' });
  const by = requireUser(session).name;
  return decide(session, { action: Audit.PrivacyUpdated, target: item.protocol, reason: note }, (a) => {
    a.privacy[id] = { status, note, at: now(), by };
  });
};

// ── A6 · dossiers ──
export const buildDossiers = async (sample: Sample) => {
  const { dossiers } = adminDemo();
  const base = await sample('admin-dossiers.json');
  return { items: base.items.map((d) => (dossiers[d.id] ? { ...d, approvedBy: dossiers[d.id]!.approvedBy, status: dossiers[d.id]!.status, reviewNote: dossiers[d.id]!.reason } : d)) };
};

export const reviewDemoDossier = async (sample: Sample, session: Session, id: string, decision: AdminDecision, reason: string) => {
  const dossier = (await buildDossiers(sample)).items.find((d) => d.id === id);
  if (!dossier) throw new ApiError(404, { error: 'not_found' });
  const outcome = reviewDossierOutcome(dossier, decision, requireUser(session).name, localeStore.get());
  if (!outcome.ok) throw invalid(outcome.message);
  const { approvedBy, status } = outcome;
  const action = decision === Decision.Approve ? Audit.DossierApproved : Audit.DossierRejected;
  return decide(session, { action, target: dossier.athlete.knownAs, reason }, (a) => {
    a.dossiers[id] = { approvedBy, status, reason };
  });
};

// ── A7 · comments and banned words ──
export const buildAdminComments = async (sample: Sample) => {
  const base = await sample('admin-comments.json');
  const { hiddenComments } = demoStore.get();
  const { bannedWordsAdded, bannedWordsRemoved } = adminDemo();
  const removed = new Set(bannedWordsRemoved);
  return {
    items: base.items.map((c) => (hiddenComments[c.id] ? { ...c, status: 'hidden' as const, hiddenReason: hiddenComments[c.id] ?? null } : c)),
    bannedWords: [...bannedWordsAdded, ...base.bannedWords.filter((w) => !removed.has(wordKey(w)))],
  };
};

export const addDemoBannedWord = async (sample: Sample, session: Session, word: BannedWord) => {
  const { bannedWords } = await buildAdminComments(sample);
  if (bannedWords.some((w) => wordKey(w) === wordKey(word))) throw invalid(currentText(API_ERROR_MESSAGES).bannedWordExists, { term: currentText(API_ERROR_MESSAGES).bannedWordExistsField });
  return decide(session, { action: Audit.BannedWordAdded, target: `${word.term} (${word.locale})`, reason: null }, (a) => {
    a.bannedWordsRemoved = a.bannedWordsRemoved.filter((k) => k !== wordKey(word));
    a.bannedWordsAdded.unshift(word);
  });
};

export const removeDemoBannedWord = (session: Session, word: Pick<BannedWord, 'locale' | 'term'>) =>
  decide(session, { action: Audit.BannedWordRemoved, target: `${word.term} (${word.locale})`, reason: null }, (a) => {
    const before = a.bannedWordsAdded.length;
    a.bannedWordsAdded = a.bannedWordsAdded.filter((w) => wordKey(w) !== wordKey(word));
    if (a.bannedWordsAdded.length === before) a.bannedWordsRemoved.push(wordKey(word));
  });

export const recordCommentModeration = (session: Session, target: string, reason: string) =>
  decide(session, { action: Audit.CommentModerated, target, reason }, () => undefined);

// ── A8 · suggestions and messages ──
export const buildAdminInbox = async (sample: Sample) => {
  const base = await sample('admin-inbox.json');
  const demo = demoStore.get();
  const { messages } = adminDemo();
  const suggestions = [...demo.suggestions, ...base.suggestions].map((s) => ({ ...s, status: demo.reviewedSuggestions[s.id] ?? s.status }));
  return { suggestions, messages: [...demo.messages, ...base.messages].map((m) => ({ ...m, status: messages[m.id] ?? m.status })) };
};

/** Approving a suggestion creates the source links of the collection (doc 21). */
export const reviewDemoSuggestion = async (sample: Sample, session: Session, id: string, status: SuggestionStatus, note: string | undefined) => {
  const suggestion = (await buildAdminInbox(sample)).suggestions.find((s) => s.id === id);
  if (!suggestion) throw new ApiError(404, { error: 'not_found' });
  const links = status === SuggestionStatus.Approved ? await queueLinks(sample, suggestion.athleteName, suggestion.sport, suggestion.urls, 'suggestion') : [];
  return decide(session, { action: Audit.SuggestionReviewed, target: `${suggestion.protocol} · ${suggestion.athleteName}`, reason: note ?? null }, (a) => {
    a.queuedLinks.unshift(...links);
  });
};

export const updateDemoMessage = (session: Session, id: string, status: ContactStatus) =>
  decide(session, { action: Audit.MessageUpdated, target: id, reason: null }, (a) => {
    a.messages[id] = status;
  });

// ── Painel · pending items per section ──
export const buildAdminSummary = async (sample: Sample): Promise<AdminSummaryResponse> => {
  const [proposals, signals, ingestion, sources, comments, inbox, dossiers, privacy] = await Promise.all([
    buildProposals(sample),
    buildTierSignals(sample),
    buildIngestion(sample),
    buildSources(sample),
    buildAdminComments(sample),
    buildAdminInbox(sample),
    buildDossiers(sample),
    buildPrivacy(sample),
  ]);
  // Same shared rule as the server (adminPendingCounts).
  return { pending: adminPendingCounts({ proposals: proposals.items, signals: signals.items, runs: ingestion.runs, sources, comments: comments.items, inbox, dossiers: dossiers.items, privacy: privacy.items }) };
};
