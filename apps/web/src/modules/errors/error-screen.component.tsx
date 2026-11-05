import './errors.page.css';

import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { PageLayout } from '@/shared-ui/page-layout.component';
import { Section } from '@/shared-ui/section.component';

import { ERRORS_TEXT } from './errors.const';

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
        <Section title={ERRORS_TEXT.shortcutsLabel}>
          <p className="muted mb-4 text-sm">{ERRORS_TEXT.searchHint}</p>
          <nav aria-label={ERRORS_TEXT.shortcutsLabel}>
            <ul className="error-shortcuts">
              {ERRORS_TEXT.shortcuts.map((s) => (
                <li key={s.to}>
                  <Link to={s.to} className="error-shortcut">
                    <b>{s.label}</b>
                    <small>{s.hint}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Section>
      </div>
    </PageLayout>
  );
}
