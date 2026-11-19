# Jiu-Jitsu Career · V1 (`bjj-career@1.0.0`)

Source: `plan/handoff/ranking.md` §9–§10. Engine: `@was/ranking`.

## Formula
`score = Σ BASE_POINTS(placement) × EVENT_MULTIPLIER(tier)` over eligible results.

| Placement | 1st | 2nd | 3rd | 4th | 5th–8th | 9th–16th | other |
|---|---|---|---|---|---|---|---|
| Points | 100 | 60 | 35 | 20 | 10 | 5 | 0 |

Multipliers (World All Stars values, not federation values): world 10 · international 8 · continental 6 · national 4 · grand slam 3 · open 2 · regional 1. Every competition is classified individually.

## Eligibility
Verified **and** official results with a valid placement. Pending, rejected, disqualified, withdrawn, cancelled, unverified and duplicate results do not score. Hall of Fame never scores (shown as a distinction).

## Classifications
Separate rankings by belt × gi/no-gi × gender (black · gi · men, black · gi · women, no-gi · men, no-gi · women). Divisions are kept as each organization names them; ADCC and IBJJF divisions are never assumed equivalent.

## Tie-breaks
score → world titles → continental titles → national titles → golds → verified results → shared position.

## Worked examples (golden tests)
World champion 100 × 10 = 1,000 · world runner-up 600 · world bronze 350 · national champion 400 · continental runner-up 360.
Two world titles + continental runner-up = 2,360 (ranks above 1,000 + 400 = 1,400).

## Publication
Results imported from Wikipedia tables start `provisional`; the ranking is published only after an admin-validated sample of ~20 athletes (handoff v3 Fase 10).
