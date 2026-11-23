import type { z } from 'zod';

import type { ContactRequestSchema, SubmissionResponseSchema, SuggestionRequestSchema } from '../schemas/contact.schema';

export type ContactRequest = z.infer<typeof ContactRequestSchema>;
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
export type SuggestionRequest = z.infer<typeof SuggestionRequestSchema>;
