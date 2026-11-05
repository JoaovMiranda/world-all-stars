import { ButtonLink } from '@/shared-ui/button-link.component';
import { Section } from '@/shared-ui/section.component';

import { CONTACT_TEXT } from './contact.const';

const t = CONTACT_TEXT.aside;

/** Side column of P17: how a suggestion is reviewed + privacy note. */
export function ContactAside() {
  return (
    <>
      <Section title={t.howTitle} headingLevel={2}>
        <ul className="contact-aside-list">
          {t.how.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <ButtonLink to="/about/criteria" variant="link" size="sm" className="mt-3">
          {t.criteria}
        </ButtonLink>
      </Section>
      <Section title={t.privacyTitle}>
        <p className="text-sm">{t.privacy}</p>
        <ButtonLink to="/legal/privacy" variant="link" size="sm" className="mt-3">
          {t.privacyLink}
        </ButtonLink>
      </Section>
    </>
  );
}
