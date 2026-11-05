import { Button } from '@/shared-ui/button.component';
import { Notice } from '@/shared-ui/notice.component';

import { CONTACT_TEXT } from './contact.const';

interface ContactSubmitFooterProps {
  label: string;
  isPending: boolean;
  /** Non-field failure (network, 5xx): the typed text stays in the form. */
  failed: boolean;
}

/** Bottom of both contact forms: Turnstile placeholder, generic failure and the submit button. */
export function ContactSubmitFooter({ label, isPending, failed }: ContactSubmitFooterProps) {
  return (
    <>
      {failed && (
        <Notice tone="danger" live="assertive">
          {CONTACT_TEXT.submitError}
        </Notice>
      )}
      <div className="contact-foot">
        <p className="turnstile">{CONTACT_TEXT.turnstile}</p>
        <Button type="submit" variant="primary" disabled={isPending} aria-busy={isPending || undefined}>
          {isPending ? CONTACT_TEXT.sending : label}
        </Button>
      </div>
    </>
  );
}
