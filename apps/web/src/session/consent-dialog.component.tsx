import { ACCOUNT_MIN_AGE, ConsentFormSchema, LEGAL_DOCUMENT_VERSIONS } from '@was/shared';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { acceptConsent } from '@/data/endpoints/account.query';
import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { Dialog } from '@/shared-ui/dialog.component';
import { Notice } from '@/shared-ui/notice.component';
import { useForm } from '@/shared-ui/use-form.hook';

import { SESSION_MESSAGES } from './session.const';

interface ConsentDialogProps {
  /** The signed-in account waiting for the acceptance (null = closed). */
  pending: { email: string; name: string } | null;
  onAccepted: () => void;
  onDecline: () => Promise<void>;
}

/**
 * Blocking consent after the first Google sign-in, or when Terms/Privacy got a new version (doc 13): two unchecked
 * boxes (Terms + Privacy with their versions; 18+). "Continuar" stays disabled until both are ticked; "Não aceito,
 * sair" signs out. Until accepted, the API treats the session as anonymous.
 */
export function ConsentDialog({ pending, onAccepted, onDecline }: ConsentDialogProps) {
  const t = useText(SESSION_MESSAGES).consent;
  const form = useForm({ schema: ConsentFormSchema, initialValues: { documents: false as never, adult: false as never } });
  const [leaving, setLeaving] = useState(false);
  const accept = acceptConsent.useMutation({ onSuccess: onAccepted });
  const ready = form.values.documents === true && form.values.adult === true;
  const { terms, privacy } = LEGAL_DOCUMENT_VERSIONS;

  const submit = form.handleSubmit(() =>
    accept.mutate({ body: { termsVersion: terms.version, privacyVersion: privacy.version, adult: true } }),
  );
  const decline = async () => {
    setLeaving(true);
    await onDecline().finally(() => setLeaving(false));
  };

  return (
    <Dialog
      open={pending !== null}
      onClose={() => undefined}
      dismissible={false}
      kicker={t.kicker}
      title={t.title}
      actions={
        <>
          <Button variant="ghost" onClick={() => void decline()} disabled={leaving || accept.isPending}>
            {t.decline}
          </Button>
          <Button variant="primary" type="submit" form="consent-form" disabled={!ready || accept.isPending}>
            {t.accept}
          </Button>
        </>
      }
    >
      {pending && <p className="muted">{t.text(pending.email)}</p>}
      <form id="consent-form" ref={form.formRef} className="consent-list" onSubmit={submit} noValidate>
        <label className="consent-check">
          <input type="checkbox" checked={form.values.documents === true} onChange={(e) => form.setValue('documents', e.target.checked as never)} />
          <span>
            {t.documentsBefore}{' '}
            <Link to="/legal/terms" target="_blank">{t.terms(terms.version)}</Link> {t.and}{' '}
            <Link to="/legal/privacy" target="_blank">{t.privacy(privacy.version)}</Link>.
          </span>
        </label>
        <label className="consent-check">
          <input type="checkbox" checked={form.values.adult === true} onChange={(e) => form.setValue('adult', e.target.checked as never)} />
          <span>{t.adult(ACCOUNT_MIN_AGE)}</span>
        </label>
        {accept.isError && (
          <Notice tone="danger" live="assertive">
            {accept.error.message || t.error}
          </Notice>
        )}
      </form>
    </Dialog>
  );
}
