# Crawler seeds (legacy)

A list of champion athletes used to populate the site. **Source of truth: Wikipedia.** Other sites are used only to
identify and cross-check athletes.

These files come from the legacy crawler in `scripts/crawler/`, which is excluded from the repository conventions and
from the English-only rule (D36). Its CSV and report files keep their original (Portuguese) names, headers and values.
The current ingestion pipeline is `packages/ingest` (`pnpm ingest <command>`).

## Running
```bash
python3 scripts/crawler/crawl_athletes.py
```
Uses only the Python standard library. Downloaded pages are cached in `data/seeds/.cache/` (gitignored), so re-runs are
fast; delete the cache to force a new download. There is a 3 s pause between requests because Wikipedia blocks clients
that request too fast.

## Files
| File | Contents |
|---|---|
| [atletas.csv](atletas.csv) | 1430 athletes, one per row (generated) |
| [relatorio-crawler.md](relatorio-crawler.md) | What was read from each source, edition by edition, with warnings (generated) |
| [fontes-crawler.csv](fontes-crawler.csv) | Crawler entry links |

## Scope
| Sport | What is included | Source |
|---|---|---|
| Football · men's World Cup 1930–2026 (23 editions) | Whole winning squad + starters in the final | Fjelstul/DataHub (1930–2022), Wikipedia (2026) |
| Football · women's World Cup 1991–2023 (9) | Same | Fjelstul/DataHub (1991–2019), Wikipedia (2023) |
| Football · men's Olympics 1908–2024 (26) | Gold-medal squad + starters in the gold-medal match | Wikipedia |
| Football · women's Olympics 1996–2024 (8) | Same | Wikipedia |
| Jiu-jitsu · ADCC | Champions per weight class, absolute and superfight, men and women | Wikipedia (ADCC) |
| Jiu-jitsu · IBJJF World Championship, black belt | Champions per weight class and absolute, men and women | Wikipedia (World IBJJF Jiu-Jitsu Championship) |
| Jiu-jitsu · owner's list | The 21 names sent by the owner (all also in ADCC) | Owner |

## Athlete CSV columns
The header row is in Portuguese (legacy). Columns, in order:

| # | Meaning |
|---|---|
| 1 | Display name (as on Wikipedia) |
| 2 | Sport: football or jiu-jitsu |
| 3 | Category: men or women |
| 4 | Winning national team (football only) |
| 5 | Titles separated by `\|`, each with edition, team and role |
| 6 | Wikipedia (en) page or search URL |
| 7 | Link kind: direct page, or search (athlete without an article; the profile crawler must resolve it) |
| 8 | Where the athlete was identified |

In football, each title records the athlete's role in the win: starter in the final, squad member (in the squad but
not a starter in the final), squad member who did not play, or squad member with unverified starter status.

## Open items
- **Starters not extracted for 9 Olympic editions**: men 1920, 1936, 1952, 1960, 1964, 1968; women 1996, 2000, 2008.
  The winning squad is complete; only the starters of the gold-medal match are missing.
- **IOC library (Statistical Kit 1908–2012)**: the site requires JavaScript and cookies (anti-bot protection), which was
  not bypassed. It was not needed, because Wikipedia covers the same period.
- **No Wikipedia article**: 99 athletes (95 jiu-jitsu, 4 football) have a search link, mostly early IBJJF World
  champions. Since Wikipedia is the source of truth, their profiles will be short.
- **Possible duplicate by spelling**: "Fernanda Mazelli" and "Fernanda Mazzelli" (IBJJF). Not merged automatically.
