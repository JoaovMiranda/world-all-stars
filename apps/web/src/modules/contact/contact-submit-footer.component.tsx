import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { Notice } from '@/shared-ui/notice.component';

import { CONTACT_MESSAGES } from './contact.const';

interface ContactSubmitFooterProps {
  label: string;
  isPending: boolean;
  /** Non-field failure (network, 5xx): the typed text stays in the form. */
  failed: boolean;
}

/** Bottom of both contact forms: Turnstile placeholder, generic failure and the submit button. */
export function ContactSubmitFooter({ label, isPending, failed }: ContactSubmitFooterProps) {
  const contactText = useText(CONTACT_MESSAGES);
  return (
    <>
      {failed && (
        <Notice tone="danger" live="assertive">
          {contactText.submitError}
        </Notice>
      )}
      <div className="contact-foot">
        <p className="turnstile">{contactText.turnstile}</p>
        <Button type="submit" variant="primary" pending={isPending}>
          {isPending ? contactText.sending : label}
        </Button>
      </div>
    </>
  );
}
