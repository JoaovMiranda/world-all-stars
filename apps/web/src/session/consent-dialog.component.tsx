import { Link } from '@tanstack/react-router';
import { ACCOUNT_MIN_AGE, ConsentFormSchema, LEGAL_DOCUMENT_VERSIONS } from '@was/shared';
import { useId, useState } from 'react';

import { acceptConsent } from '@/data/endpoints/account.query';
import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { Dialog } from '@/shared-ui/dialog.component';
import { NewTabNote } from '@/shared-ui/new-tab-note.component';
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
 * boxes (Terms + Privacy with their versions; 18+). "Continue" stays disabled until both are ticked; "I do not accept,
 * sign out" signs out. Until accepted, the API treats the session as anonymous.
 */
export function ConsentDialog({ pending, onAccepted, onDecline }: ConsentDialogProps) {
  const t = useText(SESSION_MESSAGES).consent;
  const docsId = useId();
  const hintId = useId();
  const form = useForm({ schema: ConsentFormSchema, initialValues: { documents: false as never, adult: false as never } });
  const [leaving, setLeaving] = useState(false);
  const accept = acceptConsent.useMutation({ onSuccess: onAccepted });
  const ready = form.values.documents === true && form.values.adult === true;
  const { terms, privacy } = LEGAL_DOCUMENT_VERSIONS;

  const submit = form.handleSubmit(() => accept.mutate({ body: { termsVersion: terms.version, privacyVersion: privacy.version, adult: true } }));
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
          <Button variant="primary" type="submit" form="consent-form" disabled={!ready} pending={accept.isPending} aria-describedby={hintId}>
            {t.accept}
          </Button>
        </>
      }
    >
      {pending && <p className="muted">{t.text(pending.email)}</p>}
      <form id="consent-form" ref={form.formRef} className="consent-list" onSubmit={submit} noValidate>
        {/* The links stay outside the <label> (a click on them must not tick the box); the sentence names the box. */}
        <div className="consent-check">
          <input
            id={docsId}
            type="checkbox"
            required
            aria-labelledby={`${docsId}-text`}
            checked={form.values.documents === true}
            onChange={(e) => form.setValue('documents', e.target.checked as never)}
          />
          <span id={`${docsId}-text`}>
            <label htmlFor={docsId}>{t.documentsBefore}</label>{' '}
            <Link to="/legal/terms" target="_blank">
              {t.terms(terms.version)}
              <NewTabNote />
            </Link>{' '}
            {t.and}{' '}
            <Link to="/legal/privacy" target="_blank">
              {t.privacy(privacy.version)}
              <NewTabNote />
            </Link>
            .
          </span>
        </div>
        <label className="consent-check">
          <input type="checkbox" required checked={form.values.adult === true} onChange={(e) => form.setValue('adult', e.target.checked as never)} />
          <span>{t.adult(ACCOUNT_MIN_AGE)}</span>
        </label>
        <p className="field-hint" id={hintId}>
          {t.acceptHint}
        </p>
        {accept.isError && (
          <Notice tone="danger" live="assertive">
            {accept.error.message || t.error}
          </Notice>
        )}
      </form>
    </Dialog>
  );
}
