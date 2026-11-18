import { ContactTab } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { ButtonLink } from '@/shared-ui/button-link.component';

import { LEGAL_MESSAGES } from './legal.const';

/** "Talk to us" shortcut: opens the message tab of the contact page. */
export function ContactMessageLink({ label }: { label?: string }) {
  const t = useText(LEGAL_MESSAGES).actions;
  return (
    <div className="row">
      <ButtonLink to="/contact" search={{ tipo: ContactTab.Message }} size="sm">
        {label ?? t.contactPrivacy}
      </ButtonLink>
    </div>
  );
}

/** Rights section shortcuts: self-service data page + contact. */
export function PrivacyRightsLinks() {
  const t = useText(LEGAL_MESSAGES).actions;
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
  const t = useText(LEGAL_MESSAGES).actions;
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
