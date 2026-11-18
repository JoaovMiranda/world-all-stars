import { CONSENT_PURPOSE_VALUES, LEGAL_DOCUMENT_VERSIONS, type LegalAcceptance, toIsoDate, accountDeleteConfirmationError, accountDeleteWord } from '@was/shared';
import { useState } from 'react';

import { deleteAccount, exportMyData, myDataQuery, updateConsent } from '@/data/endpoints/account.query';
import { useLocale } from '@/i18n/locale.store';
import { currentText } from '@/i18n/text-for.helper';
import { useText } from '@/i18n/use-text.hook';
import { useSession } from '@/session/use-session.hook';
import { Button } from '@/shared-ui/button.component';
import { ButtonLink } from '@/shared-ui/button-link.component';
import { DataTable } from '@/shared-ui/data-table.component';
import { Dialog } from '@/shared-ui/dialog.component';
import { DocBlocks } from '@/shared-ui/document-page-layout.component';
import { downloadJson } from '@/shared-ui/download.helper';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { FormField } from '@/shared-ui/form-field.component';
import { formatDate } from '@/shared-ui/format.helper';
import { Input } from '@/shared-ui/input.component';
import { Notice } from '@/shared-ui/notice.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { Switch } from '@/shared-ui/switch.component';
import { Tag } from '@/shared-ui/tag.component';

import { AccountLayout } from './account-layout.component';
import { ACCOUNT_MESSAGES } from './account.const';

// The 18+ declaration is a requirement of the Terms (doc 13): its row links there.
const DOC_ROUTE = { privacy: '/legal/privacy', terms: '/legal/terms', cookies: '/legal/cookies', age_declaration: '/legal/terms' } as const;

const ACCEPTANCE_COLUMNS = () => {
  const t = currentText(ACCOUNT_MESSAGES).data;
  return [
    {
      key: 'document',
      header: t.colDocument,
      cell: (a: LegalAcceptance) => (
        <ButtonLink to={DOC_ROUTE[a.document]} variant="link" size="sm">
          {t.documents[a.document]}
        </ButtonLink>
      ),
    },
    { key: 'version', header: t.colAccepted, cell: (a: LegalAcceptance) => a.version },
    { key: 'at', header: t.colAcceptedAt, cell: (a: LegalAcceptance) => formatDate(a.acceptedAt.slice(0, 10)) },
    {
      key: 'current',
      header: t.colCurrent,
      cell: (a: LegalAcceptance) => {
        const current = LEGAL_DOCUMENT_VERSIONS[a.document].version;
        return (
          <span className="row">
            {current} <Tag tone={current === a.version ? 'success' : 'gold'}>{current === a.version ? t.upToDate : t.outdated}</Tag>
          </span>
        );
      },
    },
  ];
};

function AccountInfo() {
  const t = useText(ACCOUNT_MESSAGES).data;
  const { user } = useSession();
  if (!user) return null;
  return (
    <Section title={t.accountTitle}>
      <DocBlocks
        blocks={[
          {
            kind: 'defs',
            items: [
              { term: t.name, text: user.name },
              { term: t.email, text: user.email },
              { term: t.role, text: t.roles[user.role] ?? user.role },
            ],
          },
        ]}
      />
    </Section>
  );
}

function ExportSection() {
  const t = useText(ACCOUNT_MESSAGES).data;
  const run = exportMyData.useMutation({ onSuccess: (data) => downloadJson(t.exportFileName(toIsoDate(new Date())), data) });
  return (
    <Section title={t.exportTitle}>
      <p className="mb-3">{t.exportText}</p>
      <div className="row">
        <Button variant="primary" onClick={() => run.mutate({})} disabled={run.isPending} aria-busy={run.isPending || undefined}>
          {run.isPending ? t.exporting : t.exportAction}
        </Button>
      </div>
      {run.isSuccess && (
        <Notice tone="success" live="polite" className="mt-3">
          {t.exportDone}
        </Notice>
      )}
      {run.isError && (
        <Notice tone="danger" live="assertive" className="mt-3">
          {t.exportError}
        </Notice>
      )}
    </Section>
  );
}

function ConsentsAndAcceptances() {
  const t = useText(ACCOUNT_MESSAGES).data;
  const data = myDataQuery.useQuery();
  const save = updateConsent.useMutation();
  return (
    <QueryBoundary query={data} loading={<SkeletonList rows={4} />}>
      {({ consents, acceptances }) => (
        <>
          <Section title={t.consentsTitle}>
            <p className="muted mb-4 text-sm">{t.consentsText}</p>
            <div className="account-switches">
              {CONSENT_PURPOSE_VALUES.map((purpose) => {
                const c = consents.find((x) => x.purpose === purpose);
                const text = t.consents[purpose];
                return (
                  <Switch
                    key={purpose}
                    label={text.label}
                    description={
                      <>
                        {text.description}
                        {c?.updatedAt && ` ${t.consentSince(formatDate(c.updatedAt.slice(0, 10)))}.`}
                      </>
                    }
                    checked={c?.granted ?? false}
                    disabled={save.isPending}
                    onChange={(granted) => save.mutate({ params: { purpose }, body: { granted } })}
                  />
                );
              })}
            </div>
            {save.isError && (
              <Notice tone="danger" live="assertive" className="mt-3">
                {t.consentError}
              </Notice>
            )}
          </Section>
          <Section title={t.acceptancesTitle}>
            <DataTable columns={ACCEPTANCE_COLUMNS()} rows={acceptances} rowKey={(a) => a.document} caption={t.acceptancesCaption} captionHidden emptyText={t.noAcceptances} />
          </Section>
        </>
      )}
    </QueryBoundary>
  );
}

function DeleteSection({ onDeleted }: { onDeleted: (pseudonym: string) => void }) {
  const t = useText(ACCOUNT_MESSAGES).data;
  const { signOut } = useSession();
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const [word, setWord] = useState('');
  // The word check is re-run on render (its hint follows a language switch); only the server's message is a string.
  const [checkWord, setCheckWord] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const remove = deleteAccount.useMutation({
    onSuccess: ({ pseudonym }) => {
      setOpen(false);
      onDeleted(pseudonym);
      void signOut();
    },
    onError: (e) => setError(e.message || t.deleteError),
  });
  const confirm = () => {
    setError(undefined);
    setCheckWord(true);
    if (accountDeleteConfirmationError(word, locale)) return;
    remove.mutate({ body: { confirmation: word } });
  };
  const close = () => {
    setOpen(false);
    setWord('');
    setCheckWord(false);
    setError(undefined);
  };
  return (
    <Section title={t.deleteTitle} className="danger-zone">
      <p className="mb-3">{t.deleteText}</p>
      <div className="row">
        <Button variant="danger" onClick={() => setOpen(true)}>
          {t.deleteAction}
        </Button>
        <ButtonLink to="/legal/privacy" variant="link" size="sm">
          {t.privacyLink}
        </ButtonLink>
      </div>
      <Dialog
        open={open}
        onClose={close}
        kicker={t.deleteDialogKicker}
        title={t.deleteDialogTitle}
        actions={
          <>
            <Button onClick={close}>{t.deleteCancel}</Button>
            <Button variant="danger" onClick={confirm} pending={remove.isPending}>
              {remove.isPending ? t.deleting : t.deleteConfirm}
            </Button>
          </>
        }
      >
        <p className="mb-4">{t.deleteDialogText}</p>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            confirm();
          }}
        >
          <FormField label={t.deleteConfirmLabel(accountDeleteWord(locale))} error={(checkWord ? accountDeleteConfirmationError(word, locale) : null) ?? error} required>
            {(p) => <Input {...p} value={word} autoComplete="off" onChange={(e) => setWord(e.target.value)} />}
          </FormField>
        </form>
      </Dialog>
    </Section>
  );
}

/** E6 My data (doc 13): export (JSON), consents, Terms acceptances and account deletion (anonymization). */
export function MyDataPage() {
  const t = useText(ACCOUNT_MESSAGES).data;
  const [deletedAs, setDeletedAs] = useState<string | null>(null);
  return (
    <AccountLayout title={t.title} lead={t.lead} skipGate={deletedAs !== null}>
      {deletedAs !== null ? (
        <EmptyState title={t.deletedTitle} mark="✓" action={<ButtonLink to="/">{t.backHome}</ButtonLink>}>
          <p role="status">{t.deletedText(deletedAs)}</p>
        </EmptyState>
      ) : (
        <>
          <AccountInfo />
          <ExportSection />
          <ConsentsAndAcceptances />
          <DeleteSection onDeleted={setDeletedAs} />
        </>
      )}
    </AccountLayout>
  );
}
