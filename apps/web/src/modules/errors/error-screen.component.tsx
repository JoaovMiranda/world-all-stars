import './errors.page.css';

import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { Section } from '@/shared-ui/section.component';
import { Reveal } from '@/shared-ui/reveal.component';

import { ERROR_SHORTCUTS, ERRORS_MESSAGES } from './errors.const';

interface ErrorScreenProps {
  code: string;
  eyebrow: string;
  title: string;
  text: string;
  /** Extra line under the text (e.g. the missing path). */
  detail?: ReactNode;
  actions: ReactNode;
  children?: ReactNode;
}

/** Shared body of the 404 and the generic error page (P20): big code, message, actions, search hint and shortcuts. */
export function ErrorScreen({ code, eyebrow, title, text, detail, actions, children }: ErrorScreenProps) {
  const errorsText = useText(ERRORS_MESSAGES);
  return (
    <PageLayout title={title} eyebrow={eyebrow} breadcrumb={[{ label: title }]}>
      <div className="error-screen">
        <div className="error-hero">
          <span className="error-code" aria-hidden="true">
            {code}
          </span>
          <div className="stack gap-3">
            <p>{text}</p>
            {detail}
            <div className="row">{actions}</div>
          </div>
        </div>
        {children}
        <Section title={errorsText.shortcutsLabel}>
          <p className="muted mb-4 text-sm">{errorsText.searchHint}</p>
          <nav aria-label={errorsText.shortcutsLabel}>
            <Reveal as="ul" className="error-shortcuts" stagger name="error-shortcuts">
              {ERROR_SHORTCUTS.map((s) => (
                <li key={s.to}>
                  <Link to={s.to} className="error-shortcut">
                    <b>{errorsText.shortcuts[s.key].label}</b>
                    <small>{errorsText.shortcuts[s.key].hint}</small>
                  </Link>
                </li>
              ))}
            </Reveal>
          </nav>
        </Section>
      </div>
    </PageLayout>
  );
}
