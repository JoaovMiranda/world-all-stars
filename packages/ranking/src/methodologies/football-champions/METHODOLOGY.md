# Football champions · V1.1 (`football-champions@1.1.0`)

Source: `plan/handoff/ranking-futebol.md` §5–§8 and §16; decisions D05/D06. Engine: `@was/ranking` (`runRanking`).

## Formula
`credits = Σ creditPerTitle` over **verified** winning squad memberships (`registration ∈ {registered, replacement}`,
`verification = verified`). At most one credit per player per tournament edition. `creditPerTitle = 1`.
The whole official squad is credited (D05): starting the final is a metric and a badge, never an eligibility rule.

## Eligibility
- Counts: a registered (or replacement) member of the champion squad, verified (Fjelstul squads; Wikipedia-only squads after an admin review).
- Does not count: `provisional`, `disputed`, `rejected`, `withdrawn`. Appearance does **not** change the credit (a registered player who never played is a champion).

## Rankings
One separate ranking per competition family and gender (D06):

| Key | Competition |
|---|---|
| `world-cup-men` | Men's FIFA World Cup |
| `world-cup-women` | Women's FIFA World Cup |
| `olympic-men` | Men's Olympic football tournament |
| `olympic-women` | Women's Olympic football tournament |
| `continental-<confederation>-<gender>` | Each continental championship of the config (Copa América, UEFA Euro, AFCON, Asian Cup, Gold Cup, OFC Nations Cup; women's where they exist) |
| `overview` | Consolidated career list, never hiding the breakdown (`worldCups`, `continentalTitles`, `olympicGolds`) |

## Tie-breaks (in order)
- Every competition ranking: titles → verified appearances in winning squads → earliest championship (earlier first) → shared position.
- `overview`: total credits → World Cup titles → continental titles → Olympic golds → shared position.

## Missing data
Editions without verified squads produce no credit until reviewed (the entry stays with `eligible = false` and its reason).
Continental competition slugs are configuration: a slug whose source is not validated yet simply produces an empty ranking
until T5.3.

## Worked examples per family (golden tests in `football-champions.test.ts`)
Input: offline fixture `packages/ranking/test-fixtures/football-champions/scope-families.json` (synthetic players; every
row is `registered` + `verified` + appeared unless stated). Credits are `titles × creditPerTitle (1)`.

### World Cup family
| Player | Evidence | Ranking | Credits | Position |
|---|---|---|---|---|
| M1 | men's WC 1958, 1962, 1970 | `world-cup-men` | 1 + 1 + 1 = **3** | 1st |
| M2 | men's WC 1994, 2002 + a duplicate 2002 row | `world-cup-men` | 1 + 1 (one credit per edition) = **2** | 2nd |
| M3 | men's WC 2002, registered, never appeared | `world-cup-men` | **1** (whole squad, D05) | 3rd |
| M4 | men's WC 2002, `withdrawn` | `world-cup-men` | 0 → not eligible | — |
| W1 | women's WC 1991, 1999 (+ Olympic 1996) | `world-cup-women` | **2** (the Olympic gold belongs to `olympic-women`) | 1st |
| W2 | women's WC 2015, never appeared | `world-cup-women` | **1** | 2nd |
| W3 | women's WC 2019, `provisional` | `world-cup-women` | 0 → not eligible | — |

### Olympic family
| Player | Evidence | Ranking | Credits | Position |
|---|---|---|---|---|
| O1 | men's Olympic 1952, 1964 | `olympic-men` | **2** | 1st |
| O2 | men's Olympic 2016, appeared | `olympic-men` | **1** | 2nd (1 verified appearance) |
| O3 | men's Olympic 2016, `replacement`, never appeared | `olympic-men` | **1** (replacements count) | 3rd (0 appearances) |
| W1 | women's Olympic 1996 | `olympic-women` | **1** | 1st |

### Continental family (`continental-conmebol-men`, Copa América)
| Player | Evidence | Credits | Position |
|---|---|---|---|
| C1 | Copa América 1997, 1999, 2004 | **3** | 1st |
| C2 | Copa América 2021, 2024 | **2** | 2nd |
| C3 | Copa América 2021, never appeared | **1** | 3rd |
| C4 | Copa América 2024, `disputed` | 0 → not eligible | — |

`continental-uefa-men` is empty for this fixture: each continental championship is a separate ranking.

### Overview (total → World Cups → continental → Olympic)
M1 3 (WC 3) 1st · W1 3 (WC 2, OG 1) 2nd · C1 3 (continental 3) 3rd · M2 2 (WC 2) 4th · C2 2 (continental 2) 5th ·
O1 2 (OG 2) 6th · M3 and W2 1 (WC 1) shared 7th · C3 1 (continental 1) 9th · O2 and O3 1 (OG 1) shared 10th ·
M4, W3, C4 not eligible.

### Historic examples (`src/ranking.test.ts`)
| Player | Evidence | men's World Cup | overview |
|---|---|---|---|
| Pelé | WC 1958, 1962, 1970 (verified) | 3 (1st) | 3 |
| Cafu | WC 1994, 2002 (+ duplicate 2002) | 2 | 2 |
| Messi | WC 2022 + Olympic 2008 | 1 | 2 (WC 1, OG 1) |
| Reserve 2002 | registered, never appeared | 1 (after Messi: fewer appearances) | 1 |
| Pending / rejected / disputed | — | not eligible | — |
