import './contact.page.css';

import { ContactSearchSchema, ContactTab, type SubmissionResponse } from '@was/shared';
import { useState } from 'react';

import { validationContextQuery } from '@/data/endpoints/discovery.query';
import { useSession } from '@/session/use-session.hook';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { Tabs } from '@/shared-ui/tabs.component';
import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';

import { ContactAside } from './contact-aside.component';
import { CONTACT_TEXT } from './contact.const';
import { MessageForm } from './message-form.component';
import { SubmissionReceipt } from './submission-receipt.component';
import { SuggestionForm } from './suggestion-form.component';

const t = CONTACT_TEXT;
const TABS = [
  { value: ContactTab.Suggestion, label: t.tabs.sugestao },
  { value: ContactTab.Message, label: t.tabs.mensagem },
] as const;

interface Receipt {
  tab: ContactTab;
  protocol: string;
  text: string;
  notes: readonly string[];
}

/** P17 Contact (doc 21): tabs Sugerir atleta / Mensagem (`?tipo=mensagem`), shared validators, protocol on success. */
export function ContactPage() {
  const { filters, setFilter } = useUrlFilters(ContactSearchSchema);
  const tab = filters.tipo ?? ContactTab.Suggestion;
  const { user } = useSession();
  const context = validationContextQuery.useQuery();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  // Remount the forms after "Enviar outra" or when the session changes (prefilled name/e-mail).
  const [round, setRound] = useState(0);
  const formKey = `${round}-${user?.email ?? 'anon'}`;

  const done = (protocol: SubmissionResponse['protocol'], text: string, notes: readonly string[]) => setReceipt({ tab, protocol, text, notes });

  return (
    <PageLayout title={t.page.title} eyebrow={t.page.eyebrow} lead={t.page.lead} breadcrumb={[{ label: t.page.title }]} aside={<ContactAside />}>
      <Section variant="plain">
        <Tabs
          label={t.tabsLabel}
          tabs={TABS}
          value={tab}
          onChange={(v) => {
            setReceipt(null);
            setFilter('tipo', v === ContactTab.Suggestion ? undefined : v);
          }}
        >
          <div className="card">
            <QueryBoundary query={context} loading={<SkeletonList rows={6} />}>
              {(ctx) =>
                receipt && receipt.tab === tab ? (
                  <SubmissionReceipt
                    title={tab === ContactTab.Suggestion ? t.done.suggestionTitle : t.done.messageTitle}
                    protocol={receipt.protocol}
                    text={receipt.text}
                    notes={receipt.notes}
                    onAgain={() => {
                      setReceipt(null);
                      setRound((r) => r + 1);
                    }}
                  />
                ) : tab === ContactTab.Suggestion ? (
                  <SuggestionForm key={formKey} context={ctx} email={user?.email ?? ''} onDone={(r, withEmail) => done(r.protocol, t.done.suggestionText(withEmail), r.notes)} />
                ) : (
                  <MessageForm key={formKey} context={ctx} name={user?.name ?? ''} email={user?.email ?? ''} onDone={(r) => done(r.protocol, t.done.messageText, r.notes)} />
                )
              }
            </QueryBoundary>
          </div>
        </Tabs>
      </Section>
    </PageLayout>
  );
}
