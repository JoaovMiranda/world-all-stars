// Prototype payload → API contract. The prototype names (`color: '--x'`, `schema`) become the contract names
// (`colorToken: 'x'`, `statsSchema`). Everything else keeps the repository shape (it becomes the backend later).

const isSport = (v) => v && typeof v === 'object' && 'groupSlug' in v && 'color' in v;

/** Deep-maps every embedded sport object to the contract field names. */
export const toContract = (value) => {
  if (Array.isArray(value)) return value.map(toContract);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = toContract(v);
  if (isSport(value)) {
    const { color, schema, ...rest } = out;
    return { ...rest, colorToken: String(color).replace(/^--/, ''), statsSchema: schema };
  }
  return out;
};

export const sportRef = (s) => ({ slug: s.slug, name: s.name, colorToken: s.colorToken });

/** Globe: iso2 → ISO numeric (world-atlas ids), sports keyed by name → SportRef. */
export const mapGlobe = (globe, sportsByName, alpha2ToNumeric) =>
  Object.values(globe)
    .map((c) => {
      const sports = Object.entries(c.sports).map(([name, titles]) => ({ sport: sportRef(sportsByName.get(name)), titles }));
      return {
        isoNumeric: alpha2ToNumeric(c.iso2),
        iso2: c.iso2,
        name: c.name,
        flag: c.flag,
        totalTitles: sports.reduce((s, x) => s + x.titles, 0),
        sports: sports.sort((a, b) => b.titles - a.titles),
        athletes: c.athletes,
      };
    })
    .sort((a, b) => b.totalTitles - a.totalTitles);

const iso = (s) => (s && !s.includes('T') ? `${s}T00:00:00.000Z` : s);

/** A1 queue: field conflicts + skipped AI extraction items (users never propose edits). */
export const mapProposals = (db, sourceOf) => {
  const label = (type, id) => (type === 'athletes' ? db.get('athletes', id)?.known_as : null) ?? id;
  const conflicts = db.all('field_conflicts').map((c) => ({
    id: c.id,
    origin: 'field_conflict',
    entity: { type: c.entity_type, id: c.entity_id, label: label(c.entity_type, c.entity_id) },
    field: c.field_name,
    current: c.chosen_value,
    proposed: c.other_value,
    source: sourceOf(c.other_source_link_id),
    evidenceQuote: null,
    extractedByAi: false,
    status: c.resolution === 'pending' ? 'pending' : 'approved',
    skippedAtGate: null,
    createdAt: iso(c.created_at),
  }));
  const ai = db.all('ai_extraction_queue').map((q) => {
    const link = db.get('source_links', q.source_link_id);
    return {
      id: q.id,
      origin: 'ai_extraction',
      entity: { type: link?.entity_type ?? 'unknown', id: link?.entity_id ?? q.id, label: link ? label(link.entity_type, link.entity_id) : q.section_key },
      field: q.section_key,
      current: null,
      proposed: q.result_json ? JSON.stringify(q.result_json) : null,
      source: sourceOf(q.source_link_id),
      evidenceQuote: null,
      extractedByAi: true,
      status: q.status === 'skipped' ? 'skipped' : 'pending',
      skippedAtGate: q.skipped_at_gate ?? null,
      createdAt: iso(q.created_at),
    };
  });
  return { items: [...conflicts, ...ai] };
};

export const mapRun = (r) => ({
  id: r.id, jobKey: r.job_key, mode: r.mode, startedAt: iso(r.started_at), finishedAt: iso(r.finished_at) ?? null,
  status: r.status, checked: r.checked, unchanged: r.unchanged, updated: r.updated, errors: r.errors,
});
