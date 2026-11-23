import type { z } from 'zod';

import type { GlobeCountrySchema } from '../schemas/globe-country.schema';

export type GlobeCountry = z.infer<typeof GlobeCountrySchema>;
