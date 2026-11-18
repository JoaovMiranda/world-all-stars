import type { z } from 'zod';

import { VALIDATION_MESSAGES } from '../consts/validation-messages.const';
import { DEFAULT_LOCALE, type Locale } from '../i18n/locale.const';
import { textFor } from '../i18n/messages.helper';

type Issue = Parameters<z.core.$ZodErrorMap>[0];

const build = (locale: Locale): z.core.$ZodErrorMap => {
  const m = textFor(VALIDATION_MESSAGES, locale);
  const s = m.schema;
  return (issue: Issue) => {
    switch (issue.code) {
      case 'invalid_type':
        return issue.input === undefined || issue.input === null ? m.required : s.invalid;
      case 'too_small': {
        const min = Number(issue.minimum);
        if (issue.origin === 'string') return min <= 1 ? m.required : s.tooShort(min);
        if (issue.origin === 'array' || issue.origin === 'set') return min <= 1 ? m.required : s.tooFew(min);
        return s.tooSmall(min);
      }
      case 'too_big': {
        const max = Number(issue.maximum);
        if (issue.origin === 'string') return s.tooLong(max);
        if (issue.origin === 'array' || issue.origin === 'set') return s.tooMany(max);
        return s.tooBig(max);
      }
      case 'invalid_format':
        if (issue.format === 'email') return m.emailInvalid;
        if (issue.format === 'url') return m.urlInvalid;
        return issue.format === 'date' || issue.format === 'datetime' ? s.date : s.invalid;
      case 'invalid_value':
        return issue.values.length === 1 && issue.values[0] === true ? s.mustAccept : s.choose;
      case 'unrecognized_keys':
        return s.unknownFields(issue.keys.join(', '));
      default:
        return s.invalid;
    }
  };
};

const maps = new Map<Locale, z.core.$ZodErrorMap>();

/**
 * Per-locale Zod error map (doc 12): the generic messages of the shared schemas (required, too long, invalid e-mail…)
 * in the request/interface language. Messages a schema sets itself (refine/superRefine) win. Same map on the server
 * (contract validation → 422 field errors) and in the web forms (useForm): `schema.safeParse(v, { error: zodErrorMap(locale) })`.
 */
export const zodErrorMap = (locale: Locale = DEFAULT_LOCALE): z.core.$ZodErrorMap => {
  let map = maps.get(locale);
  if (!map) maps.set(locale, (map = build(locale)));
  return map;
};
