import type { z } from 'zod';

import type { ConsentSchema, DeleteAccountResponseSchema, LegalAcceptanceSchema, MyDataExportSchema, MyDataResponseSchema } from '../schemas/my-data.schema';

export type LegalAcceptance = z.infer<typeof LegalAcceptanceSchema>;
export type Consent = z.infer<typeof ConsentSchema>;
export type MyDataResponse = z.infer<typeof MyDataResponseSchema>;
export type DeleteAccountResponse = z.infer<typeof DeleteAccountResponseSchema>;
export type MyDataExport = z.infer<typeof MyDataExportSchema>;
