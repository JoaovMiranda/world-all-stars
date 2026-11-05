import { AddCollectionLinksRequestSchema, COLLECTION_LINKS_MAX, type FieldErrors, checkSourceUrl } from '@was/shared';
import { type FormEvent, useRef, useState } from 'react';

import { isApiError } from '@/data/api-error.error';
import { addCollectionLinks } from '@/data/endpoints/admin.query';
import { validationContextQuery } from '@/data/endpoints/discovery.query';
import { Button } from '@/shared-ui/button.component';
import { FormField } from '@/shared-ui/form-field.component';
import { Input } from '@/shared-ui/input.component';
import { Notice } from '@/shared-ui/notice.component';
import { Section } from '@/shared-ui/section.component';
import { Select } from '@/shared-ui/select.component';

import { ADMIN_TEXT } from './admin.const';

const T = ADMIN_TEXT.sources;

/** A3 · add an athlete + 1–3 links to the collection; every link is checked live with the shared checkSourceUrl. */
export function CollectionLinksForm() {
  const ctx = validationContextQuery.useQuery();
  const add = addCollectionLinks.useMutation();
  const formRef = useRef<HTMLFormElement>(null);
  const [athleteName, setAthleteName] = useState('');
  const [sport, setSport] = useState('');
  const [urls, setUrls] = useState<string[]>(['']);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState<number | null>(null);
  const sources = ctx.data?.sources ?? [];

  const validate = (): FieldErrors => {
    const out: FieldErrors = {};
    const parsed = AddCollectionLinksRequestSchema.safeParse({ athleteName, urls: urls.filter((u) => u.trim()) });
    if (!parsed.success) for (const i of parsed.error.issues) out[i.path.map(String).join('.') || '_form'] ??= i.message;
    urls.forEach((u, i) => {
      if (!u.trim()) return;
      const r = checkSourceUrl(u, sources);
      if (!r.ok) out[`urls.${i}`] = r.message;
    });
    if (!urls.some((u) => u.trim())) out['urls.0'] ??= out.urls ?? T.urlHint;
    return out;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSent(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const clean = urls.map((u) => u.trim()).filter(Boolean);
    try {
      await add.mutateAsync({ body: { athleteName: athleteName.trim(), urls: clean, ...(sport ? { sport } : {}) } });
      setSent(clean.length);
      setAthleteName('');
      setSport('');
      setUrls(['']);
    } catch (err) {
      setErrors(isApiError(err) && err.body.errors ? err.body.errors : { _form: err instanceof Error ? err.message : '' });
    }
  };

  const hintFor = (u: string) => {
    if (!u.trim() || !sources.length) return T.urlHint;
    const r = checkSourceUrl(u, sources);
    if (!r.ok) return T.urlHint;
    return r.note ?? (r.source ? T.knownSource(r.source.name) : T.unknownSource);
  };

  return (
    <Section title={T.formTitle}>
      <p className="muted mb-4">{T.formLead}</p>
      <form ref={formRef} className="form-grid" onSubmit={(e) => void submit(e)} noValidate>
        <FormField label={T.athleteName} error={errors.athleteName} required>
          {(p) => <Input {...p} value={athleteName} onChange={(e) => setAthleteName(e.target.value)} maxLength={120} autoComplete="off" />}
        </FormField>
        <FormField label={T.sport}>
          {(p) => <Select {...p} value={sport} onChange={(e) => setSport(e.target.value)} placeholder={T.sportPlaceholder} options={(ctx.data?.sports ?? []).map((s) => ({ value: s.slug, label: s.name }))} />}
        </FormField>
        {urls.map((u, i) => (
          <div key={i} className="admin-url-row">
            <FormField label={T.url(i + 1)} hint={hintFor(u)} error={errors[`urls.${i}`]} required={i === 0}>
              {(p) => <Input {...p} type="url" inputMode="url" value={u} onChange={(e) => setUrls(urls.map((x, j) => (j === i ? e.target.value : x)))} />}
            </FormField>
            {urls.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => setUrls(urls.filter((_, j) => j !== i))} aria-label={T.removeUrl(i + 1)}>
                ×
              </Button>
            )}
          </div>
        ))}
        {errors._form && <Notice tone="danger" live="assertive">{errors._form}</Notice>}
        {sent !== null && <Notice tone="success" live="polite">{T.sent(sent)}</Notice>}
        <div className="form-actions">
          {urls.length < COLLECTION_LINKS_MAX && (
            <Button variant="ghost" onClick={() => setUrls([...urls, ''])}>
              {T.addUrl}
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={add.isPending}>
            {T.submit}
          </Button>
        </div>
      </form>
    </Section>
  );
}
