import { SetOfficialTierRequestSchema, type Tier, TIER_ORDER } from '@was/shared';
import { useState } from 'react';

import { isApiError } from '@/data/api-error.error';
import { setOfficialTier } from '@/data/endpoints/tier-votes.query';
import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { DOMAIN_LABELS_MESSAGES } from '@/shared-ui/domain-labels.const';
import { FormField } from '@/shared-ui/form-field.component';
import { Input } from '@/shared-ui/input.component';
import { Notice } from '@/shared-ui/notice.component';
import { Select } from '@/shared-ui/select.component';
import { useForm } from '@/shared-ui/use-form.hook';

import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';

/** Admin: change the official tier with a mandatory reason (Mythic needs an approved dossier, doc 17). */
export function AdminTierForm({ slug, official }: { slug: string; official: Tier }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).vote.admin;
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  const OPTIONS = TIER_ORDER.map((v) => ({ value: v, label: labels.tier[v] }));
  const form = useForm({ schema: SetOfficialTierRequestSchema, initialValues: { tier: official, reason: '' } });
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const mutation = setOfficialTier.useMutation({
    onSuccess: (r) => {
      setResult({ ok: true, text: T.saved(labels.tier[r.official]) });
      form.reset({ tier: r.official, reason: '' });
    },
    onError: (e) => setResult({ ok: false, text: isApiError(e) && e.body.message ? e.body.message : T.error }),
  });

  return (
    <form
      ref={form.formRef}
      className="admin-tier"
      noValidate
      onSubmit={form.handleSubmit((body) => {
        setResult(null);
        mutation.mutate({ params: { slug }, body });
      })}
    >
      <span className="label label-gold">{T.title}</span>
      <div className="admin-tier-fields">
        <FormField label={T.tier} error={form.errors.tier}>
          {(p) => <Select {...p} {...form.register('tier')} options={OPTIONS} />}
        </FormField>
        <FormField label={T.reason} hint={T.reasonHint} error={form.errors.reason} required>
          {(p) => <Input {...p} {...form.register('reason')} autoComplete="off" />}
        </FormField>
      </div>
      <div className="form-actions">
        <Button type="submit" variant="primary" pending={mutation.isPending}>
          {T.submit}
        </Button>
      </div>
      {result && (
        <Notice tone={result.ok ? 'success' : 'danger'} live={result.ok ? 'polite' : 'assertive'}>
          {result.text}
        </Notice>
      )}
    </form>
  );
}
