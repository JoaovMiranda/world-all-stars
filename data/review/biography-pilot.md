# Biography pilot (T1.6 / T1.7)

Run on 2026-11-23 and 2026-11-24 with `OLLAMA_URL=http://localhost:11434 OLLAMA_MODEL=qwen2.5:14b pnpm ingest collect --list ../../data/review/pilot-collect.csv`
(the path is relative to `packages/ingest`, where `pnpm ingest` runs). Each run used a fresh prompt version, so the model was
called for every athlete (`unchanged: 0`). Fact validator: `fact-check@1` on every level-3 biography; an unsupported or
invalid fact-check triggers one regeneration, then the proposal goes to the exception queue.

Database: a copy of `.data/pglite` (`PGLITE_DATA_DIR=<scratchpad>/pglite-pilot`), so the owner's local database was not
changed by the pilot (no migration applied, no biography written). Results below come from the CLI summary line plus
`ai_invocations` / `ai_extraction_queue` rows of each run; `pnpm ingest ai-report` on the pilot copy after the four runs:

```
{"provider":"ollama","model":"qwen2.5:14b","task":"biography","calls":65,"tokens":174706,"avg_latency_ms":53677,"cost":0,"approved":18,"rejected":0}
{"provider":"ollama","model":"qwen2.5:14b","task":"fact-check","calls":31,"tokens":76079,"avg_latency_ms":29706,"cost":0,"approved":0,"rejected":0}
```

(`approved` counts every auto-accepted biography in the copy, including earlier `biography@3` runs made before the copy.)

**Accept criterion (≥ 8/10 auto-accepted): not met.** Best run: 6/10. Blocker recorded in `plan/handoff/blockers.md`.

## Summary

| Iteration | Prompt | Accepted | Queued | Rejected | Model calls (bio + fact-check) | CLI summary |
|---|---|---|---|---|---|---|
| 1 | `biography@3` (card rules; labels SOURCE/FACTS) | 6 | 3 | 1 | 11 + 7 | `invocations 11, accepted 6, proposals 3, rejected 2` |
| 2 | `biography@4` (+ do not restate the opening sentence; quote 5–40 words, ≤ 300 chars) | 1 | 7 | 2 | 14 + 7 | `invocations 14, accepted 1, proposals 7, rejected 5` |
| 3 | `biography@5` (+ one fact per claim; exact-match warning, keep parentheses) | 4 | 5 | 1 | 14 + 9 | `invocations 14, accepted 4, proposals 5, rejected 3` |
| 4 | `biography@6` (quote rules as a list: one sentence, 5–25 words, ≤ 200 chars, no bare year lists) | 3 | 7 | 0 | 14 + 8 | `invocations 14, accepted 3, proposals 7, rejected 2` |

The CLI `rejected` counter also counts level-1 proposals (queued for a human but without enough literal quotes); the
table above counts only biographies with no queue row (schema failure, level 0) as rejected.

## Failure causes (all four runs: 53 biography calls, 31 fact-check calls)

Biography calls by validation level: 31 × level 3, 8 × level 2, 8 × level 1, 6 × level 0.

- **Fact-check quote not literal (deterministic audit)**: of 31 `fact-check@1` calls, 14 supported every claim, 10 marked
  every claim `supported` but copied at least one `evidence_quote` that is not a literal substring of SOURCE/FACTS
  (`runFactCheck` then reports `unsupported`), 6 marked a claim `unsupported` (mostly right: compound claims such as
  "won the -88 kg and absolute divisions in 2017" when the source says absolute was 2nd), 1 invalid JSON.
- **Copied 12-word run (level 2)**: all 8 level-2 calls; the model keeps the Wikipedia lead ("is a Brazilian former professional
  footballer who played as an attacking midfielder …") despite the rule.
- **Too few literal quotes (level 1)**: 8 calls; quotes re-worded ("born July 8, 1995" for "(born July 8, 1995)"),
  merged across sentences, or bare year lists ("2017, 2019, and 2022").
- **Schema (level 0)**: 6 calls; the 5 inspected all had an `evidence_quote` longer than 400 characters (the model ignores the length
  rule and pastes a whole paragraph).
- Variance between runs is large (Bebeto, Buchecha stable; Romário 1 → 0 → 1 → 2 levels across runs), so a single run of
  ten athletes does not separate the prompt versions; `biography@3` scoring best is within that noise.

## Iteration 1 — `biography@3`

Note: this run used the card-aligned `biography@3` wording (labels `SOURCE` / `FACTS`, "at most 6 claims"). The owner's
local database already holds `biography@3` invocations made with the earlier wording (`TEXT` / `KNOWN FACTS`), so the
version now in code is `biography@6`, never `@3` with new text.

| Athlete | Outcome | Calls (validation level → fact-check) |
|---|---|---|
| Cafu | **queued** (level 1) | bio L1 |
| Rivaldo | **queued** (level 2, copied 12-word run) | bio L3 → fact-check unsupported claim → bio L2 |
| Romário | **accepted** | bio L3 → fact-check supported |
| Bebeto | **accepted** | bio L3 → fact-check supported |
| Ronaldinho | **rejected** (schema, level 0) | bio L0 |
| Kaká | **queued** (level 2, copied 12-word run) | bio L2 |
| Roger Gracie | **accepted** | bio L3 → fact-check supported |
| Marcelo Garcia | **accepted** | bio L3 → fact-check supported |
| Gordon Ryan | **accepted** | bio L3 → fact-check supported |
| Marcus Buchecha | **accepted** | bio L3 → fact-check supported |

## Iteration 2 — `biography@4`

| Athlete | Outcome | Calls (validation level → fact-check) |
|---|---|---|
| Cafu | **queued** (level 1) | bio L1 |
| Rivaldo | **rejected** (schema, level 0) | bio L0 |
| Romário | **rejected** (schema, level 0) | bio L0 |
| Bebeto | **accepted** | bio L3 → fact-check unsupported claim → bio L3 → fact-check supported |
| Ronaldinho | **queued** (level 2) | bio L3 → fact-check all supported, non-literal quote → bio L3 → fact-check all supported, non-literal quote |
| Kaká | **queued** (level 2, copied 12-word run) | bio L2 |
| Roger Gracie | **queued** (level 2, copied 12-word run) | bio L2 |
| Marcelo Garcia | **queued** (level 1) | bio L1 |
| Gordon Ryan | **queued** (level 1) | bio L3 → fact-check unsupported claim → bio L1 |
| Marcus Buchecha | **queued** (level 2) | bio L3 → fact-check unsupported claim → bio L3 → fact-check unsupported claim |

## Iteration 3 — `biography@5`

| Athlete | Outcome | Calls (validation level → fact-check) |
|---|---|---|
| Cafu | **queued** (level 2) | bio L3 → fact-check all supported, non-literal quote → bio L3 → fact-check invalid JSON |
| Rivaldo | **rejected** (schema, level 0) | bio L0 |
| Romário | **queued** (level 1) | bio L1 |
| Bebeto | **accepted** | bio L3 → fact-check supported |
| Ronaldinho | **queued** (level 2) | bio L3 → fact-check all supported, non-literal quote → bio L0 |
| Kaká | **accepted** | bio L3 → fact-check unsupported claim → bio L3 → fact-check supported |
| Roger Gracie | **queued** (level 2, copied 12-word run) | bio L3 → fact-check all supported, non-literal quote → bio L2 |
| Marcelo Garcia | **accepted** | bio L3 → fact-check supported |
| Gordon Ryan | **queued** (level 1) | bio L1 |
| Marcus Buchecha | **accepted** | bio L3 → fact-check supported |

## Iteration 4 — `biography@6` (current `BIOGRAPHY_PROMPT_VERSION`)

| Athlete | Outcome | Calls (validation level → fact-check) |
|---|---|---|
| Cafu | **queued** (level 1) | bio L3 → fact-check all supported, non-literal quote → bio L1 |
| Rivaldo | **queued** (level 2) | bio L3 → fact-check all supported, non-literal quote → bio L0 |
| Romário | **queued** (level 2) | bio L3 → fact-check all supported, non-literal quote → bio L3 → fact-check all supported, non-literal quote |
| Bebeto | **accepted** | bio L3 → fact-check supported |
| Ronaldinho | **queued** (level 2, copied 12-word run) | bio L2 |
| Kaká | **queued** (level 2, copied 12-word run) | bio L2 |
| Roger Gracie | **accepted** | bio L3 → fact-check supported |
| Marcelo Garcia | **queued** (level 2, copied 12-word run) | bio L3 → fact-check all supported, non-literal quote → bio L2 |
| Gordon Ryan | **queued** (level 1) | bio L1 |
| Marcus Buchecha | **accepted** | bio L3 → fact-check supported |
