import { type FieldErrors, SUGGESTION_URLS_MAX, withDefaultHttps } from '@was/shared';
import { useId } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { FormField } from '@/shared-ui/form-field.component';
import { Input } from '@/shared-ui/input.component';

import { CONTACT_MESSAGES } from './contact.const';

interface SourceLinksFieldProps {
  urls: readonly string[];
  onChange: (urls: string[]) => void;
  /** Errors by path: `urls` (group) and `urls.N` (one link). */
  errors: FieldErrors;
}

/** 1 to SUGGESTION_URLS_MAX source links (doc 21). A group error is shown on the first link, so focus lands there. */
export function SourceLinksField({ urls, onChange, errors }: SourceLinksFieldProps) {
  const t = useText(CONTACT_MESSAGES).suggestion;
  const legendId = useId();
  const set = (index: number, value: string) => onChange(urls.map((u, i) => (i === index ? value : u)));
  // The removed row took the focused button with it: focus the link field above (WCAG 2.4.3).
  const remove = (index: number) => {
    onChange(urls.filter((_, i) => i !== index));
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[data-url-index="${index - 1}"]`)?.focus());
  };
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
            {(p) => (
              <Input
                {...p}
                type="url"
                inputMode="url"
                // Not "url": that token means the user's own homepage (WCAG 1.3.5), these are third-party sources.
                autoComplete="off"
                placeholder={t.urlPlaceholder}
                data-url-index={i}
                value={url}
                onChange={(e) => set(i, e.target.value)}
                // Postel: "pt.wikipedia.org/…" becomes "https://pt.wikipedia.org/…" when leaving the field.
                onBlur={(e) => {
                  const fixed = withDefaultHttps(e.target.value);
                  if (fixed !== e.target.value) set(i, fixed);
                }}
              />
            )}
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
