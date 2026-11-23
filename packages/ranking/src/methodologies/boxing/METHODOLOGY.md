# Boxing career ranking — methodology v1 (`boxing`)

Versioned ruleset `boxing@1`. The score is a career readout of competitive achievement inside boxing; it is never
compared across sports (the cross-sport band is a separate, bounded readout). Every counted evidence is a row of the
universal model with its own provenance and review status.

## Weights (defaults in `boxing-config.schema.ts`)

| Item | Points |
|---|---|
| World title, per organization | The Ring 3 · WBA/WBC/IBF/WBO 4 · IBO 2 |
| Undisputed (once per division) | 10 |
| Title defense | 1 |
| Each distinct division with a counted title | 2 |
| Olympic medal | gold 6 · silver 3 · bronze 1 |
| Longevity (each career year after the 10th, capped) | 1, cap 10 |
| Hall of Fame recognition | 5 |

Designation thresholds: mythical ≥ 80 · legendary ≥ 50 · champion ≥ 20 · contender otherwise.

Eligibility: at least one counted title (open ranking) or at least one title in the ranking's division. Olympic medals and
Hall of Fame entries never make a boxer eligible on their own — the ranking is about professional championship merit.

Tie-break: score, then number of titles, then number of defenses.

## Hand-computed examples

### 1. Two-division champion (45 points, designation `champion`)

WBC heavyweight title (4) + WBA heavyweight title flagged undisputed (4 + 10) + WBC cruiserweight title (4) + three
heavyweight defenses (3) + two distinct divisions (2 × 2) + Olympic gold (6) + Hall of Fame (5) + career 2005–2020
(15 years → 5 longevity points) = **45**. 45 ≥ 20 and < 50 → `champion`.

### 2. Single-title contender (4 points, designation `contender`)

IBO light-heavyweight title (2) + one distinct division (2) + no defense, 6 career years (no longevity bonus), no Olympic
medal, no Hall = **4**. 4 < 20 → `contender`.

### 3. Unified champion (29 points, designation `champion`)

WBC + IBF + WBO middleweight titles (3 × 4 = 12) + undisputed on the WBC row (10) + five defenses (5) + one distinct
division (2) + 5 career years (no longevity bonus) = **29** → `champion`.

> These examples are executable: `boxing.test.ts` asserts the three totals, their order and the division eligibility.

Fixture: the examples' input is the offline JSON `packages/ranking/test-fixtures/boxing/examples.json` (competitors `a`, `b`, `c` = examples 1, 2, 3), loaded by `boxing.test.ts` with `loadRankingFixture`.
