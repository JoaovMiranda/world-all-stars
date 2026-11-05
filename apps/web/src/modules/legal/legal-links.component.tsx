import { ContactTab } from '@was/shared';

import { ButtonLink } from '@/shared-ui/button-link.component';

import { LEGAL_TEXT } from './legal.const';

const t = LEGAL_TEXT.actions;

/** "Talk to us" shortcut: opens the message tab of the contact page. */
export function ContactMessageLink({ label = t.contactPrivacy }: { label?: string }) {
  return (
    <div className="row">
      <ButtonLink to="/contact" search={{ tipo: ContactTab.Message }} size="sm">
        {label}
      </ButtonLink>
    </div>
  );
}

/** Rights section shortcuts: self-service data page + contact. */
export function PrivacyRightsLinks() {
  return (
    <div className="row">
      <ButtonLink to="/me/data" size="sm" variant="primary">
        {t.myData}
      </ButtonLink>
      <ButtonLink to="/contact" search={{ tipo: ContactTab.Message }} size="sm">
        {t.contactPrivacy}
      </ButtonLink>
    </div>
  );
}

/** Links between the legal documents. */
export function RelatedLegalLinks({ show }: { show: readonly ('privacy' | 'terms' | 'cookies')[] }) {
  return (
    <div className="row">
      {show.includes('privacy') && (
        <ButtonLink to="/legal/privacy" size="sm" variant="link">
          {t.privacy}
        </ButtonLink>
      )}
      {show.includes('terms') && (
        <ButtonLink to="/legal/terms" size="sm" variant="link">
          {t.terms}
        </ButtonLink>
      )}
      {show.includes('cookies') && (
        <ButtonLink to="/legal/cookies" size="sm" variant="link">
          {t.cookies}
        </ButtonLink>
      )}
    </div>
  );
}
