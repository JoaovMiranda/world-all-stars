import { ParticipationApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { submitContact, submitSuggestion } from './contact.service';

export const contactRoutes = [
  defineRoute(ParticipationApi.submitSuggestion, ({ body }, ctx) => submitSuggestion(ctx, body), { rateLimit: 'contact' }),
  defineRoute(ParticipationApi.submitContact, ({ body }, ctx) => submitContact(ctx, body), { rateLimit: 'contact' }),
];
