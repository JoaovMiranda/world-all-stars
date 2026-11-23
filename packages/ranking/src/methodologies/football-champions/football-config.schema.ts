import { z } from 'zod';

import { FOOTBALL_CONTINENTAL } from './football-champions.const';

export const FootballConfigSchema = z.object({
  creditPerTitle: z.number().positive().default(1),
  countableRegistration: z.array(z.string()).default(['registered', 'replacement']),
  countableVerification: z.array(z.string()).default(['verified']),
  continental: z
    .array(z.object({ confederation: z.string(), gender: z.string(), competition: z.string() }))
    .default(FOOTBALL_CONTINENTAL.map((c) => ({ ...c }))),
});
