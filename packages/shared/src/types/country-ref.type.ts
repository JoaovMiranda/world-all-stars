import type { z } from 'zod';

import type { CountryRefSchema } from '../schemas/country-ref.schema';

export type CountryRef = z.infer<typeof CountryRefSchema>;
