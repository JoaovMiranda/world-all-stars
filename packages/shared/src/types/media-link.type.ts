import type { z } from 'zod';

import type { MediaLinkSchema } from '../schemas/media-link.schema';

export type MediaLink = z.infer<typeof MediaLinkSchema>;
