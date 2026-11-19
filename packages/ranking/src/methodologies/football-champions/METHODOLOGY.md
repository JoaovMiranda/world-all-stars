# Football World Champions · V1 (`football-champions@1.0.0`)

Source: `plan/handoff/ranking-futebol.md` §5–§8 and §16. Engine: `@was/ranking` (`runRanking`).

## Formula
`credits = Σ creditPerTitle` over **verified** winning squad memberships (`registration ∈ {registered, replacement}`, `verification = verified`).
At most one credit per player per tournament edition. `creditPerTitle = 1`.

## Eligibility
- Counts: a registered (or replacement) member of the champion squad, verified (Fjelstul squads; Wikipedia-only squads after an admin review).
- Does not count: `provisional`, `disputed`, `rejected`, `withdrawn`. Appearance does **not** change the credit (a registered player who never played is a champion).

## Rankings
A men's World Cup · B women's World Cup · C men's Olympic football · D women's Olympic football · E consolidated overview (never hides the competition breakdown: metrics `worldCups`, `olympicGolds`).

## Tie-breaks (in order)
- A/B: World Cup titles → verified appearances in winning squads → earliest championship (earlier first) → shared position.
- C/D: Olympic golds → verified appearances → earliest championship → shared position.
- E: total credits → World Cup titles → Olympic golds → shared position.

## Missing data
Editions without verified squads produce no credit until reviewed (the entry stays with `eligible = false` and its reason).

## Worked examples (golden tests in `src/ranking.test.ts`)
| Player | Evidence | A | E |
|---|---|---|---|
| Pelé | WC 1958, 1962, 1970 (verified) | 3 (1st) | 3 |
| Cafu | WC 1994, 2002 (+ duplicate 2002) | 2 | 2 |
| Messi | WC 2022 + Olympic 2008 | 1 | 2 (WC 1, OG 1) |
| Reserve 2002 | registered, never appeared | 1 (after Messi: fewer appearances) | 1 |
| Pending / rejected / disputed | — | not eligible | — |
