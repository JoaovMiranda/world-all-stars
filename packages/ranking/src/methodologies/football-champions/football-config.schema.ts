import { z } from 'zod';

export const FootballConfigSchema = z.object({
  creditPerTitle: z.number().positive().default(1),
  countableRegistration: z.array(z.string()).default(['registered', 'replacement']),
  countableVerification: z.array(z.string()).default(['verified']),
});
