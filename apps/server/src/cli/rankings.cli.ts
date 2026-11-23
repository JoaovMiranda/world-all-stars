// pnpm rankings:calculate [methodology…] — calculates CANDIDATE snapshots (never publishes: two admins approve in
// the admin, handoff v3 §8). PGlite is single-process: stop `pnpm dev` first.
import { BaseCli } from '@was/db';

import { createApp } from '../app';
import { loadConfig } from '../config/env.config';
import { calculateRankings } from '../modules/rankings/rankings.service';

class RankingsCli extends BaseCli {
  protected async run(): Promise<void> {
    const { deps } = createApp({ db: this.db, config: { ...loadConfig(this.env), logRequests: false } });
    const methodologies = this.args.length ? this.args : ['football-champions', 'bjj-career'];
    for (const m of methodologies)
      this.log(`${m}: ${(await calculateRankings(deps, m, { userId: null, name: 'rankings cli', via: 'system:ranking' })).length} candidate snapshot(s)`);
  }
}

await new RankingsCli().start();
