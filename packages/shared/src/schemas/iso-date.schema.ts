import { z } from 'zod';

/** Calendar date without time, `YYYY-MM-DD` (always the client's local day). */
export const IsoDateSchema = z.iso.date();
