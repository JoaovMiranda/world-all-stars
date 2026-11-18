import { BANNED_WORD_MATCH_MODE_VALUES, type BannedWord, type BannedWordMatchMode, WORD_SPLIT_REGEX, canonicalizeForModeration, cleanText, hasBannedWord } from '@was/shared';
import { type FormEvent, useState } from 'react';

import { isApiError } from '@/data/api-error.error';
import { addBannedWord, removeBannedWord } from '@/data/endpoints/admin.query';
import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { DataTable } from '@/shared-ui/data-table.component';
import { DecisionBar } from '@/shared-ui/decision-bar.component';
import { FormField } from '@/shared-ui/form-field.component';
import { Input } from '@/shared-ui/input.component';
import { Notice } from '@/shared-ui/notice.component';
import { Section } from '@/shared-ui/section.component';
import { Select } from '@/shared-ui/select.component';
import { StatusFilter } from '@/shared-ui/status-filter.component';
import { Textarea } from '@/shared-ui/textarea.component';

import { ADMIN_MESSAGES } from './admin.const';
import type { QueueState } from './queue-state.type';
import { currentAdminMeta, useAdminMeta } from './use-admin-meta.hook';

const localeLabel = (l: string) => currentAdminMeta().locale[l] ?? l;
const canonicalText = (text: string) => cleanText(text).split(WORD_SPLIT_REGEX).filter(Boolean).map(canonicalizeForModeration).join(' ');

function AddWordForm({ locales }: { locales: string[] }) {
  const T = useText(ADMIN_MESSAGES).comments;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const add = addBannedWord.useMutation();
  const [term, setTerm] = useState('');
  const [matchMode, setMatchMode] = useState<BannedWordMatchMode>('word');
  const [locale, setLocale] = useState(locales[0] ?? 'pt-BR');
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<string>();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setDone(undefined);
    const value = term.trim();
    if (!value) return setError(adminText.comments.term);
    try {
      await add.mutateAsync({ body: { term: value, matchMode, locale } });
      setTerm('');
      setError(undefined);
      setDone(T.added(value));
    } catch (err) {
      setError(isApiError(err) ? (err.body.errors?.term ?? err.message) : String(err));
    }
  };
  return (
    <form className="form-grid" onSubmit={(e) => void submit(e)} noValidate>
      <FormField label={T.term} error={error} required>
        {(p) => <Input {...p} value={term} onChange={(e) => setTerm(e.target.value)} maxLength={60} autoComplete="off" />}
      </FormField>
      <FormField label={T.mode}>
        {(p) => <Select {...p} value={matchMode} onChange={(e) => setMatchMode(e.target.value as BannedWordMatchMode)} options={BANNED_WORD_MATCH_MODE_VALUES.map((m) => ({ value: m, label: meta.matchMode[m] }))} />}
      </FormField>
      <FormField label={T.locale}>
        {(p) => <Select {...p} value={locale} onChange={(e) => setLocale(e.target.value)} options={locales.map((l) => ({ value: l, label: localeLabel(l) }))} />}
      </FormField>
      {done && <Notice tone="success" live="polite">{done}</Notice>}
      <div className="form-actions">
        <Button type="submit" variant="primary" disabled={add.isPending}>
          {T.add}
        </Button>
      </div>
    </form>
  );
}

function MatchPreview({ words }: { words: readonly BannedWord[] }) {
  const T = useText(ADMIN_MESSAGES).comments;
  const [text, setText] = useState('');
  const hits = text.trim() ? words.filter((w) => hasBannedWord(text, [w])) : [];
  return (
    <div className="form-grid">
      <FormField label={T.previewLabel} hint={T.previewHint}>
        {(p) => <Textarea {...p} rows={3} value={text} onChange={(e) => setText(e.target.value)} />}
      </FormField>
      {text.trim() && (
        <div aria-live="polite" className="flex flex-col gap-2">
          <p className="m-0">
            <span className="label">{T.previewNormalized}</span> <code className="admin-wrap">{canonicalText(text)}</code>
          </p>
          {hits.length ? (
            <Notice tone="danger">
              <span className="admin-preview-hit">{T.previewBlocked(hits.map((h) => `${h.term} (${localeLabel(h.locale)})`).join(', '))}</span>
            </Notice>
          ) : (
            <Notice tone="success">{T.previewClean}</Notice>
          )}
        </div>
      )}
    </div>
  );
}

/** A7 · banned words per locale: list, add/remove, and a live preview with the shared normalization (doc 20). */
export function BannedWords({ words, state }: { words: readonly BannedWord[]; state: QueueState }) {
  const T = useText(ADMIN_MESSAGES).comments;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const remove = removeBannedWord.useMutation();
  const locales = [...new Set(['pt-BR', 'en', 'es', ...words.map((w) => w.locale)])];
  const locale = state.status && locales.includes(state.status) ? state.status : undefined;
  const rows = locale ? words.filter((w) => w.locale === locale) : words;
  return (
    <div className="stack">
      <Section title={T.wordsTitle}>
        <div className="stack">
          <StatusFilter
            label={T.localeFilter}
            total={words.length}
            options={locales.map((l) => ({ value: l, label: localeLabel(l), count: words.filter((w) => w.locale === l).length }))}
            value={locale}
            onChange={state.setStatus}
          />
          <DataTable
            caption={T.wordsCaption}
            captionHidden
            emptyText={T.wordsEmpty}
            rows={rows}
            rowKey={(w) => `${w.locale}:${w.term}`}
            columns={[
              { key: 'term', header: T.term, cell: (w) => <b>{w.term}</b>, sortValue: (w) => w.term },
              { key: 'canonical', header: T.canonical, cell: (w) => <code>{canonicalizeForModeration(w.term)}</code> },
              { key: 'mode', header: T.mode, cell: (w) => meta.matchMode[w.matchMode] },
              { key: 'locale', header: T.locale, cell: (w) => localeLabel(w.locale), sortValue: (w) => w.locale },
              {
                key: 'remove',
                header: adminText.common.actions,
                cell: (w) => (
                  <DecisionBar
                    label={T.removeLabel(w.term)}
                    actions={[{ key: 'rm', label: T.remove, variant: 'danger', confirmTitle: T.removeTitle(w.term), onConfirm: () => remove.mutateAsync({ params: { locale: w.locale, term: w.term } }) }]}
                  />
                ),
              },
            ]}
          />
        </div>
      </Section>
      <div className="grid">
        <Section title={T.addTitle} span={4}>
          <AddWordForm locales={locales} />
        </Section>
        <Section title={T.previewTitle} span={8}>
          <MatchPreview words={words} />
        </Section>
      </div>
    </div>
  );
}
