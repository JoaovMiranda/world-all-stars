import { type FieldErrors, SUGGESTION_URLS_MAX } from '@was/shared';
import { useId } from 'react';

import { Button } from '@/shared-ui/button.component';
import { FormField } from '@/shared-ui/form-field.component';
import { Input } from '@/shared-ui/input.component';

import { CONTACT_TEXT } from './contact.const';

const t = CONTACT_TEXT.suggestion;

interface SourceLinksFieldProps {
  urls: readonly string[];
  onChange: (urls: string[]) => void;
  /** Errors by path: `urls` (group) and `urls.N` (one link). */
  errors: FieldErrors;
}

/** 1 to SUGGESTION_URLS_MAX source links (doc 21). A group error is shown on the first link, so focus lands there. */
export function SourceLinksField({ urls, onChange, errors }: SourceLinksFieldProps) {
  const legendId = useId();
  const set = (index: number, value: string) => onChange(urls.map((u, i) => (i === index ? value : u)));
  const remove = (index: number) => onChange(urls.filter((_, i) => i !== index));
  const add = () => {
    onChange([...urls, '']);
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[data-url-index="${urls.length}"]`)?.focus());
  };

  return (
    <fieldset className="contact-fieldset" aria-describedby={`${legendId}-hint`}>
      <legend id={legendId}>
        {t.urls}
        <span className="req" aria-hidden="true">
          *
        </span>{' '}
        <span className="contact-optional">{t.urlsRequired}</span>
      </legend>
      <p className="field-hint" id={`${legendId}-hint`}>
        {t.urlsHint}
      </p>
      {urls.map((url, i) => (
        <div key={i} className="url-row">
          <FormField label={t.urlLabel(i + 1)} required={i === 0} error={errors[`urls.${i}`] ?? (i === 0 ? errors.urls : undefined)}>
            {(p) => <Input {...p} type="url" inputMode="url" autoComplete="url" placeholder={t.urlPlaceholder} data-url-index={i} value={url} onChange={(e) => set(i, e.target.value)} />}
          </FormField>
          {i > 0 && (
            <Button size="sm" variant="ghost" onClick={() => remove(i)} aria-label={t.removeUrl(i + 1)}>
              {t.remove}
            </Button>
          )}
        </div>
      ))}
      {urls.length < SUGGESTION_URLS_MAX && (
        <div>
          <Button size="sm" variant="link" onClick={add}>
            {t.addUrl}
          </Button>
        </div>
      )}
    </fieldset>
  );
}
