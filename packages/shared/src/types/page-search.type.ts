import type { z } from 'zod';

import type { AthleteProfileSearchSchema, ContactSearchSchema, HomeSearchSchema, NotificationsSearchSchema } from '../schemas/page-search.schema';

export type AthleteProfileSearch = z.infer<typeof AthleteProfileSearchSchema>;
export type ContactSearch = z.infer<typeof ContactSearchSchema>;
export type HomeSearch = z.infer<typeof HomeSearchSchema>;
export type NotificationsSearch = z.infer<typeof NotificationsSearchSchema>;
