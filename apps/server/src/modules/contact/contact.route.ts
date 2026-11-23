import { ParticipationApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { ContactController } from './contact.controller';

export const contactRoutes = [
  defineRoute(ParticipationApi.submitSuggestion, (input, ctx) => new ContactController(ctx).submitSuggestion(input), { rateLimit: 'contact' }),
  defineRoute(ParticipationApi.submitContact, (input, ctx) => new ContactController(ctx).submitContact(input), { rateLimit: 'contact' }),
];
