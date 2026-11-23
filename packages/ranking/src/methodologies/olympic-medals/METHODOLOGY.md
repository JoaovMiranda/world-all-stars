# Olympic medals ranking — methodology v1 (`olympic-medals`)

Versioned ruleset `olympic-medals@1`. It reads the medal record of each athlete (individual and team medals, credited to
every member of the entry) and produces one overall ranking plus one ranking per configured sport. The medal table per
NOC and edition is a **classification** (a public readout of the Games), never a ranking of people.

## Weights (defaults in `olympic-medals-config.schema.ts`)

| Medal | Points |
|---|---|
| Gold | 3 |
| Silver | 2 |
| Bronze | 1 |

`teamMedalCreditsMembers` (default `true`) credits a team medal to every member of the entry; when `false` only
individual medals count.

Eligibility: at least one counted medal in the ranking's scope. Tie-break: weighted total, golds, silvers, bronzes, then
the earliest medal (earlier first).

## Hand-computed examples

### 1. All-round medalist (9 points)

Gold 2008 swimming (3) + silver 2012 swimming (2) + bronze 2016 athletics (1) + team gold 2020 football (3) = **9**,
with `gold 2 · silver 1 · bronze 1 · medals 4 · sports 3`.

### 2. Two-time silver medalist (4 points)

Silver 2012 swimming (2) + silver 2016 swimming (2) = **4**, with `gold 0 · silver 2 · bronze 0 · medals 2 · sports 1`.

### 3. Team bronze (1 point)

Bronze 2020 football, team entry credited to the member (+1) = **1**.

### Medal table, 2012 (classification)

BRA: 1 silver; USA: 1 silver → ordered BRA, USA (tie on gold/silver/bronze, then NOC).

> These examples are executable: `olympic-medals.test.ts` asserts the totals, the per-sport isolation and the medal table.

Fixture: the examples' input is the offline JSON `packages/ranking/test-fixtures/olympic-medals/examples.json` (competitors `a`, `b`, `c` = examples 1, 2, 3), loaded by `olympic-medals.test.ts` with `loadRankingFixture`.
