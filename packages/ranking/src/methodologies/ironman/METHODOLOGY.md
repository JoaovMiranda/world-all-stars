# Ironman ranking — methodology v1 (`ironman`)

Versioned ruleset `ironman@1`. It scores world championship titles, podiums at the world championship and course
records. Rankings are the overall career list plus one ranking per configured world-championship event.

## Weights (defaults in `ironman-config.schema.ts`)

| Item | Points |
|---|---|
| World championship title | 10 |
| World championship podium (2nd–3rd) | 3 |
| Course record (any race) | 5 |

Eligibility: at least one world championship title or podium in the ranking's scope. A course record alone never makes
a competitor eligible; it only adds points to a career that already has championship results.
Tie-break: score, then world titles, then podiums, then course records.

## Hand-computed examples

### 1. Three-time champion (38 points)

World titles 2010, 2012 and 2014 (3 × 10 = 30) + one 2nd place in 2016 (3) + one course record (5) = **38**.

### 2. Consistent podium finisher (16 points)

One world title (10) + two podiums (2 × 3 = 6) = **16**.

### 3. Course-record specialist (10 points)

Two course records outside the championship (2 × 5 = 10) = **10**; not eligible in the championship ranking.

> These examples are executable: `ironman.test.ts` asserts the totals, the championship eligibility and the order.

Fixture: the examples' input is the offline JSON `packages/ranking/test-fixtures/ironman/examples.json` (competitors `a`, `b`, `c` = examples 1, 2, 3), loaded by `ironman.test.ts` with `loadRankingFixture`.
