import type { AthleteProfile, FieldConflict, FieldProvenance } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { DataTable } from '@/shared-ui/data-table.component';
import { formatDate } from '@/shared-ui/format.helper';
import { Section } from '@/shared-ui/section.component';
import { Tag } from '@/shared-ui/tag.component';
import { Timeline } from '@/shared-ui/timeline.component';

import { fieldLabel } from './athlete-profile.helper';
import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';

const SYSTEM_AUTHOR = 'system';
const PENDING = 'pending';

/** Sources: conflicts between sources, provenance of each field and the version history. */
export function SourcesTab({ profile: p }: { profile: AthleteProfile }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).sources;
  const D = useText(ATHLETE_PROFILE_MESSAGES).dash;
  const profileText = useText(ATHLETE_PROFILE_MESSAGES);
  return (
    <div className="stack">
      {p.conflicts.length > 0 && (
        <Section title={T.conflictsTitle}>
          <DataTable<FieldConflict>
            caption={T.conflictsCaption}
            captionHidden
            rows={p.conflicts}
            rowKey={(c) => `${c.field}·${c.other.value}`}
            columns={[
              { key: 'field', header: T.field, cell: (c) => fieldLabel(c.field) },
              {
                key: 'chosen',
                header: T.shown,
                cell: (c) => (
                  <>
                    <b>{c.chosen.value}</b> <span className="muted">· {c.chosen.source?.name ?? D}</span>
                  </>
                ),
              },
              {
                key: 'other',
                header: T.divergent,
                cell: (c) => (
                  <>
                    {c.other.value} <span className="muted">· {c.other.source?.name ?? D}</span>
                  </>
                ),
              },
              { key: 'status', header: T.status, cell: (c) => <Tag tone="danger">{c.resolution === PENDING ? T.pending : c.resolution}</Tag> },
            ]}
          />
        </Section>
      )}
      <Section title={T.provenanceTitle}>
        <DataTable<FieldProvenance>
          caption={T.provenanceCaption}
          captionHidden
          rows={p.provenance}
          rowKey={(x) => `${x.field}·${x.source?.slug ?? ''}·${x.ref ?? ''}`}
          emptyText={T.noProvenance}
          columns={[
            { key: 'field', header: T.field, sortValue: (x) => fieldLabel(x.field), cell: (x) => fieldLabel(x.field) },
            {
              key: 'source',
              header: T.source,
              sortValue: (x) => x.source?.name ?? null,
              cell: (x) =>
                x.source ? (
                  <a href={x.source.url} target="_blank" rel="noopener noreferrer">
                    {x.source.name}
                    <span className="sr-only"> {profileText.infobox.external}</span>
                  </a>
                ) : (
                  D
                ),
            },
            { key: 'ref', header: T.reference, cell: (x) => <span className="muted">{x.ref ?? D}</span> },
            { key: 'license', header: T.license, cell: (x) => x.source?.license ?? D },
            {
              key: 'at',
              header: T.retrieved,
              sortValue: (x) => x.retrievedAt,
              cell: (x) => <span className="num">{x.retrievedAt ? formatDate(x.retrievedAt) : D}</span>,
            },
          ]}
        />
      </Section>
      <Section title={T.versionsTitle} eyebrow={T.current(p.version.current)}>
        <Timeline
          label={T.versionsTitle}
          items={p.version.history.map((v) => ({
            key: String(v.n),
            when: T.version(v.n),
            title: v.summary,
            detail: v.author,
            tone: v.author.startsWith(SYSTEM_AUTHOR) ? 'muted' : 'default',
          }))}
        />
      </Section>
    </div>
  );
}
