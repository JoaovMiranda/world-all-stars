import { ParticipationApi } from '@was/shared';

import { defineMutation } from '../define-endpoint.helper';
import { submitDemoContact, submitDemoSuggestion } from '../fixtures/submissions.fixture';

/** POST /api/suggestions (doc 21): public, link required. 422 `{ errors }` keyed by field path. */
export const submitSuggestion = defineMutation(ParticipationApi.submitSuggestion, ({ input, sample }) => submitDemoSuggestion(sample, input.body));

/** POST /api/contact (doc 21). */
export const submitContact = defineMutation(ParticipationApi.submitContact, ({ input, sample }) => submitDemoContact(sample, input.body));
