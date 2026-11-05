import { useEffect, useId, useRef } from 'react';

import { Button } from '@/shared-ui/button.component';
import { ButtonLink } from '@/shared-ui/button-link.component';

import { CONTACT_TEXT } from './contact.const';

const t = CONTACT_TEXT.done;

interface SubmissionReceiptProps {
  title: string;
  protocol: string;
  text: string;
  notes: readonly string[];
  onAgain: () => void;
}

/** Confirmation with the protocol (SUG-… / CTT-…), without leaving the page; focus moves here (doc 21). */
export function SubmissionReceipt({ title, protocol, text, notes, onAgain }: SubmissionReceiptProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div ref={ref} className="contact-done" role="status" aria-labelledby={titleId} tabIndex={-1}>
      <span className="label label-gold">{t.kicker}</span>
      <h2 id={titleId}>{title}</h2>
      <p>
        {t.protocol} <span className="contact-protocol">{protocol}</span>. {text}
      </p>
      {notes.length > 0 && (
        <div>
          <p className="label">{t.notesTitle}</p>
          <ul className="contact-aside-list mt-2">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="row mt-2">
        <Button variant="primary" onClick={onAgain}>
          {t.again}
        </Button>
        <ButtonLink to="/">{t.home}</ButtonLink>
      </div>
    </div>
  );
}
