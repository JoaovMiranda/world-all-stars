import type { z } from 'zod';

import type { ChessConfigSchema } from './chess-config.schema';

export type ChessConfig = z.infer<typeof ChessConfigSchema>;
