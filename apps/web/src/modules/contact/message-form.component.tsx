import {
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_TOPIC_VALUES,
  type SubmissionResponse,
  type ValidationContext,
  createContactInputSchema,
} from '@was/shared';
import { useMemo } from 'react';

import { submitContact } from '@/data/endpoints/contact.query';
import { CharCounter } from '@/shared-ui/char-counter.component';
import { CONTACT_TOPIC_LABEL } from '@/shared-ui/domain-labels.const';
import { FormField } from '@/shared-ui/form-field.component';
import { Input } from '@/shared-ui/input.component';
import { Select } from '@/shared-ui/select.component';
import { Textarea } from '@/shared-ui/textarea.component';
import { useForm } from '@/shared-ui/use-form.hook';

import { fieldErrorsOf } from './contact-errors.helper';
import { ContactSubmitFooter } from './contact-submit-footer.component';
import { CONTACT_TEXT } from './contact.const';

const t = CONTACT_TEXT.message;
const TOPIC_OPTIONS = CONTACT_TOPIC_VALUES.map((value) => ({ value, label: CONTACT_TOPIC_LABEL[value] }));

interface MessageFormProps {
  context: ValidationContext;
  name: string;
  email: string;
  onDone: (result: SubmissionResponse) => void;
}

/** "Mensagem" (doc 21): name, e-mail, topic and body (≤ 1000, no banned words), validated by the shared rules. */
export function MessageForm({ context, name, email, onDone }: MessageFormProps) {
  const schema = useMemo(() => createContactInputSchema(context.bannedWords), [context.bannedWords]);
  const form = useForm({ schema, initialValues: { name, email, topic: '', body: '' } });
  const { values, errors } = form;
  const send = submitContact.useMutation({
    onSuccess: onDone,
    onError: (error) => {
      const fieldErrors = fieldErrorsOf(error);
      if (fieldErrors) form.setServerErrors(fieldErrors);
    },
  });

  return (
    <form ref={form.formRef} className="contact-form" noValidate onSubmit={form.handleSubmit((body) => send.mutate({ body }))}>
      <div className="contact-two">
        <FormField label={t.name} required error={errors.name}>
          {(p) => <Input {...p} {...form.register('name')} autoComplete="name" />}
        </FormField>
        <FormField label={t.email} required error={errors.email}>
          {(p) => <Input {...p} {...form.register('email')} type="email" autoComplete="email" />}
        </FormField>
      </div>
      <FormField label={t.topic} required error={errors.topic}>
        {(p) => <Select {...p} {...form.register('topic')} options={TOPIC_OPTIONS} placeholder={t.topicPlaceholder} />}
      </FormField>
      <FormField
        label={t.body}
        required
        hint={t.bodyHint}
        error={errors.body}
        counter={<CharCounter value={values.body} max={CONTACT_MESSAGE_MAX_LENGTH} />}
      >
        {(p) => <Textarea {...p} {...form.register('body')} rows={6} />}
      </FormField>
      <ContactSubmitFooter label={t.submit} isPending={send.isPending} failed={send.isError && !fieldErrorsOf(send.error)} />
    </form>
  );
}
