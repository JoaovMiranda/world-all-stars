import { athleteSuggestions, contactMessages } from '@was/db';
import {
  type ContactRequest,
  type ContactTopic,
  cleanText,
  type SubmissionResponse,
  type SuggestionRequest,
  submissionProtocol,
  validateContact,
  validateSuggestion,
} from '@was/shared';

import { BaseService } from '../../core/base.service';
import { invalidFields } from '../../http/http-error.helper';
import { ModerationRepository } from '../moderation/moderation.repository';
import { ValidationContextService } from '../moderation/validation-context.service';

/** Public submissions (doc 21): athlete suggestions and contact messages. */
export class ContactService extends BaseService {
  /** POST /api/suggestions (doc 21): shared validateSuggestion (https, anti-SSRF, rejected sources, duplicates) → 422. */
  async submitSuggestion(body: SuggestionRequest): Promise<SubmissionResponse> {
    const ctx = this.ctx;
    const [context, view] = await Promise.all([new ValidationContextService(ctx).getSuggestionContext(), ctx.deps.catalog.get(ctx.locale)]);
    const result = validateSuggestion(body, context, ctx.locale);
    if (!result.ok) throw invalidFields(result.errors);
    const sport = body.sport && body.sport !== 'outro' ? view.sportBySlug(body.sport) : null;
    const protocol = submissionProtocol('SUG');
    await this.repo.insert(
      athleteSuggestions,
      {
        athleteName: result.name,
        sportId: sport?.id ?? null,
        sportOther: body.sport === 'outro' ? cleanText(body.sportOther) || null : sport ? null : cleanText(body.sport) || null,
        urls: result.urls,
        justification: cleanText(body.why) || null,
        contactEmail: cleanText(body.email) || ctx.session.user?.email || null,
        userId: ctx.session.user?.id ?? null,
        protocol,
        ipHash: ctx.ipHash,
      },
      this.actor,
    );
    return { protocol, notes: result.notes };
  }

  /** POST /api/contact (doc 21): shared validateContact → 422. */
  async submitContact(body: ContactRequest): Promise<SubmissionResponse> {
    const ctx = this.ctx;
    const result = validateContact(body, await new ModerationRepository(this.db).loadBannedWords(), ctx.locale);
    if (!result.ok) throw invalidFields(result.errors);
    const protocol = submissionProtocol('CTT');
    await this.repo.insert(
      contactMessages,
      {
        name: cleanText(body.name),
        email: body.email.trim(),
        topic: body.topic as ContactTopic,
        body: cleanText(body.body),
        userId: ctx.session.user?.id ?? null,
        protocol,
        ipHash: ctx.ipHash,
      },
      this.actor,
    );
    return { protocol, notes: [] };
  }
}
