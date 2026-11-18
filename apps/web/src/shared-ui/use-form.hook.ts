import { type FieldErrors, zodErrorMap } from '@was/shared';
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { z } from 'zod';

import { useLocale } from '@/i18n/locale.store';

const issuesToErrors = (issues: readonly z.core.$ZodIssue[]): FieldErrors => {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || '_form';
    errors[key] ??= issue.message;
  }
  return errors;
};

interface UseFormOptions<S extends z.ZodType> {
  /** Shared Zod schema (e.g. createCommentInputSchema(bannedWords)). `null` while its context loads. */
  schema: S | null;
  initialValues: z.input<S>;
}

/**
 * Minimal form state wired to the shared Zod validators: values, field errors by path (`urls.0`), validation on
 * submit then live, server 422 errors, and focus on the first invalid field (doc 21). Messages are in the interface
 * language (generic ones through zodErrorMap); after a language switch the shown errors are validated again, so
 * they never stay in the previous language (a server-only error, e.g. a 429, is dropped then).
 */
export function useForm<S extends z.ZodType>({ schema, initialValues }: UseFormOptions<S>) {
  type Values = z.input<S>;
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const locale = useLocale();

  const check = useCallback(
    (next: Values): { ok: true; data: z.output<S> } | { ok: false; errors: FieldErrors } => {
      if (!schema) return { ok: false, errors: {} };
      const result = schema.safeParse(next, { error: zodErrorMap(locale) });
      return result.success ? { ok: true, data: result.data } : { ok: false, errors: issuesToErrors(result.error.issues) };
    },
    [schema, locale],
  );

  // Language switch (new schema/locale → new `check`): errors on screen are rebuilt in the new language.
  const latest = useRef({ values, hasErrors: false });
  latest.current = { values, hasErrors: Object.keys(errors).length > 0 };
  useEffect(() => {
    if (!latest.current.hasErrors) return;
    const r = check(latest.current.values);
    setErrors(r.ok ? {} : r.errors);
  }, [check]);

  const setValue = useCallback(
    <K extends keyof Values>(key: K, value: Values[K]) => {
      setValues((prev) => {
        const next = { ...(prev as object), [key]: value } as Values;
        if (submitted) {
          const r = check(next);
          setErrors(r.ok ? {} : r.errors);
        }
        return next;
      });
    },
    [check, submitted],
  );

  /** Binds a top-level string field to an input/select/textarea. */
  const register = <K extends keyof Values & string>(name: K) => ({
    name,
    value: (values[name] ?? '') as string,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setValue(name, e.target.value as Values[K]),
  });

  const focusFirstError = () => requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());

  /** Server-side errors (422 `{ errors }`) shown exactly like client ones. */
  const setServerErrors = (serverErrors: FieldErrors) => {
    setErrors(serverErrors);
    focusFirstError();
  };

  const handleSubmit = (onValid: (data: z.output<S>) => void | Promise<void>) => (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const r = check(values);
    if (!r.ok) {
      setErrors(r.errors);
      focusFirstError();
      return;
    }
    setErrors({});
    void onValid(r.data);
  };

  const reset = (next: Values = initialValues) => {
    setValues(next);
    setErrors({});
    setSubmitted(false);
  };

  return { values, setValue, register, errors, setServerErrors, handleSubmit, reset, formRef, isSubmitted: submitted };
}
