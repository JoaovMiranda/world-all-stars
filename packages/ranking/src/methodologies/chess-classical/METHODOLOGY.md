# Chess ranking — methodology v1 (`chess-classical`)

Versioned ruleset `chess@1`. It scores world titles by time control, the peak published rating and the years as world
number one. Sources are Wikipedia and Wikidata; FIDE is link-only and is never fetched at render time. Rankings are one
overall list plus one per time control; a time-control ranking only considers titles, ratings and #1 years of that
format (format-agnostic rows count in both).

## Weights (defaults in `chess-config.schema.ts`)

| Item | Points |
|---|---|
| Classical world title | 10 |
| Rapid world title | 4 |
| Blitz world title | 2 |
| Peak rating above 2700 | 1 per 10 points |
| Year as world number one | 1 |

Eligibility: at least one world title or at least one year as world number one in the ranking's scope.
Tie-break: score, then classical titles, then peak rating.

## Hand-computed examples

### 1. Classical dominator (54 points)

Classical titles 1970, 1972, 1975 (3 × 10 = 30) + one rapid title (4) + peak rating 2850 ((2850 − 2700) / 10 = 15) +
5 years as #1 (5) = **54**.

### 2. Classical champion (22 points)

One classical title (10) + peak 2800 (10) + 2 years as #1 (2) = **22**.

### 3. Blitz specialist (9 points)

Two blitz titles (4) + peak 2750 (5) = **9**; in the classical ranking this player is not eligible.

> These examples are executable: `chess-classical.test.ts` asserts the totals, the per-format isolation and the order.

Fixture: the examples' input is the offline JSON `packages/ranking/test-fixtures/chess-classical/examples.json` (competitors `a`, `b`, `c` = examples 1, 2, 3), loaded by `chess-classical.test.ts` with `loadRankingFixture`.
