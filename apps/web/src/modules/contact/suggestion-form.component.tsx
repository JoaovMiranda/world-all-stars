import {
  type SubmissionResponse,
  SUGGESTION_WHY_MAX_LENGTH,
  type ValidationContext,
  cleanText,
  createSuggestionInputSchema,
  validateSuggestion,
} from '@was/shared';
import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';

import { submitSuggestion } from '@/data/endpoints/contact.query';
import { useLocale } from '@/i18n/locale.store';
import { useFormat } from '@/i18n/use-format.hook';
import { useText } from '@/i18n/use-text.hook';
import { CharCounter } from '@/shared-ui/char-counter.component';
import { FormField } from '@/shared-ui/form-field.component';
import { Input } from '@/shared-ui/input.component';
import { Select } from '@/shared-ui/select.component';
import { Textarea } from '@/shared-ui/textarea.component';
import { useForm } from '@/shared-ui/use-form.hook';

import { fieldErrorsOf } from './contact-errors.helper';
import { ContactSubmitFooter } from './contact-submit-footer.component';
import { SourceLinksField } from './source-links-field.component';
import { CONTACT_MESSAGES, SPORT_OTHER_VALUE } from './contact.const';

interface SuggestionFormProps {
  context: ValidationContext;
  /** Prefilled when signed in (doc 21). */
  email: string;
  onDone: (result: SubmissionResponse, withEmail: boolean) => void;
}

/** "Sugerir atleta" (doc 21): same shared validator as the server (https, anti-SSRF, rejected sources, duplicates). */
export function SuggestionForm({ context, email, onDone }: SuggestionFormProps) {
  const locale = useLocale();
  const t = useText(CONTACT_MESSAGES).suggestion;
  const fmt = useFormat();
  const contactText = useText(CONTACT_MESSAGES);
  const schema = useMemo(() => createSuggestionInputSchema(context, locale), [context, locale]);
  const form = useForm({ schema, initialValues: { athleteName: '', sport: '', sportOther: '', urls: [''], why: '', email } });
  const { values, errors } = form;
  const send = submitSuggestion.useMutation({
    onSuccess: (result) => onDone(result, Boolean(cleanText(values.email))),
    onError: (error) => {
      const fieldErrors = fieldErrorsOf(error);
      if (fieldErrors) form.setServerErrors(fieldErrors);
    },
  });
  // "Já está no site": the shared validator also tells which profile, to link it next to the error.
  const existing = errors.athleteName ? validateSuggestion(values, context, locale).existing : null;
  const sportOptions = useMemo(
    () => [...context.sports].sort((a, b) => fmt.compare(a.name, b.name)).map((s) => ({ value: s.slug, label: s.name })),
    [context.sports, fmt],
  );
  const isOther = values.sport === SPORT_OTHER_VALUE;

  return (
    <form
      ref={form.formRef}
      className="contact-form"
      noValidate
      onSubmit={form.handleSubmit((data) =>
        send.mutate({
          body: {
            athleteName: data.athleteName,
            sport: data.sport || null,
            sportOther: isOther ? data.sportOther || null : null,
            urls: data.urls.map((u) => u.trim()).filter(Boolean),
            why: data.why || null,
            email: data.email || null,
          },
        }),
      )}
    >
      <FormField
        label={t.name}
        required
        error={errors.athleteName}
        counter={
          existing && (
            <Link to="/athletes/$slug" params={{ slug: existing.slug }}>
              {t.seeProfile(existing.knownAs)}
            </Link>
          )
        }
      >
        {(p) => <Input {...p} {...form.register('athleteName')} autoComplete="off" />}
      </FormField>
      <div className="contact-two">
        <FormField label={t.sport}>
          {(p) => (
            <Select {...p} {...form.register('sport')} options={sportOptions} placeholder={t.sportUnknown}>
              <option value={SPORT_OTHER_VALUE}>{t.sportOther}</option>
            </Select>
          )}
        </FormField>
        {isOther && <FormField label={t.sportOtherLabel}>{(p) => <Input {...p} {...form.register('sportOther')} />}</FormField>}
      </div>
      <SourceLinksField urls={values.urls} onChange={(urls) => form.setValue('urls', urls)} errors={errors} />
      <FormField
        label={
          <>
            {t.why} <span className="contact-optional">{t.whyOptional}</span>
          </>
        }
        hint={t.whyHint}
        error={errors.why}
        counter={<CharCounter value={values.why ?? ''} max={SUGGESTION_WHY_MAX_LENGTH} />}
      >
        {(p) => <Textarea {...p} {...form.register('why')} rows={4} />}
      </FormField>
      <FormField
        label={
          <>
            {t.email} <span className="contact-optional">{t.emailOptional}</span>
          </>
        }
        error={errors.email}
      >
        {(p) => <Input {...p} {...form.register('email')} type="email" autoComplete="email" />}
      </FormField>
      <ContactSubmitFooter label={t.submit} isPending={send.isPending} failed={send.isError && !fieldErrorsOf(send.error)} />
    </form>
  );
}
