import type { SourceOverview } from '@was/shared';

import { currentText } from '@/i18n/text-for.helper';
import { useText } from '@/i18n/use-text.hook';
import { DataTable, type DataColumn } from '@/shared-ui/data-table.component';
import { DOMAIN_LABELS_MESSAGES } from '@/shared-ui/domain-labels.const';
import { formatDate } from '@/shared-ui/format.helper';
import { Notice } from '@/shared-ui/notice.component';
import { Tag } from '@/shared-ui/tag.component';

import { COMMERCIAL_USE_TONE, RUN_STATUS_TONE, SOURCES_MESSAGES, USAGE_STATUS_TONE } from './sources.const';

type SourceLink = SourceOverview['links'][number];

const LINK_COLUMNS = (): readonly DataColumn<SourceLink>[] => {
  const t = currentText(SOURCES_MESSAGES).list;
  return [
    {
      key: 'url',
      header: t.colLink,
      cell: (l) => (
        <a className="break-all" href={l.url} target="_blank" rel="noopener noreferrer">
          {l.url.replace(/^https?:\/\//, '')}
          <span className="sr-only"> {t.external}</span>
        </a>
      ),
    },
    { key: 'entity', header: t.colEntity, sortValue: (l) => l.athlete ?? l.entity, cell: (l) => l.athlete ?? l.entity },
    { key: 'revision', header: t.colRevision, align: 'end', cell: (l) => l.revision ?? t.dash },
    { key: 'checked', header: t.colChecked, align: 'end', sortValue: (l) => l.checked, cell: (l) => (l.checked ? formatDate(l.checked) : t.dash) },
  ];
};

function Count({ value, label }: { value: number; label: string }) {
  return (
    <span className="src-cell">
      <b className="display-num">{value}</b>
      <small>{label}</small>
    </span>
  );
}

/** One source of the registry: summary row (status, use, coverage, last run) expanding to notes and collected links. */
export function SourceItem({ source }: { source: SourceOverview }) {
  const T = useText(SOURCES_MESSAGES);
  const t = useText(SOURCES_MESSAGES).list;
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  const useLabel = T.commercialUse[source.commercialUse];
  const useTone = COMMERCIAL_USE_TONE[source.commercialUse];
  const run = source.lastRun;
  return (
    <details className="src-item">
      <summary>
        <span className="src-name">
          <b>{source.name}</b>
          <small>
            {T.originKind[source.originKind]} · {source.license}
          </small>
        </span>
        <span className="src-cell">
          <Tag tone={USAGE_STATUS_TONE[source.usageStatus]}>{labels.sourceUsage[source.usageStatus]}</Tag>
          <small className={useTone ? `tone-${useTone}` : undefined}>{useLabel ?? source.commercialUse}</small>
        </span>
        <Count value={source.athletes.length} label={t.athletes} />
        <Count value={source.fields} label={t.fields} />
        <Count value={source.achievements} label={t.achievements} />
        <span className="src-cell">
          {run ? (
            <>
              <Tag tone={RUN_STATUS_TONE[run.status]}>{T.runStatus[run.status]}</Tag>
              <small>
                {run.jobKey} · {formatDate(run.startedAt.slice(0, 10))}
              </small>
            </>
          ) : (
            <small>{t.noRun}</small>
          )}
        </span>
      </summary>
      <div className="src-body">
        {source.usageNote && <Notice className="mt-3">{source.usageNote}</Notice>}
        {run && <p className="muted mt-2.5 text-sm">{t.lastRun(run.checked, run.unchanged, run.updated, run.errors, run.mode)}</p>}
        {source.links.length > 0 ? (
          <div className="mt-2.5">
            <DataTable columns={LINK_COLUMNS()} rows={source.links} rowKey={(l) => l.url} caption={t.linksCaption(source.name)} captionHidden />
          </div>
        ) : (
          <p className="empty">{t.noLinks}</p>
        )}
        <p className="mt-2.5">
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="break-all">
            {source.url}
            <span className="sr-only"> {t.external}</span>
          </a>
        </p>
      </div>
    </details>
  );
}
