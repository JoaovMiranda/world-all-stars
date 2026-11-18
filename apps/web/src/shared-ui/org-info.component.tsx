
import { useText } from '@/i18n/use-text.hook';

import { DOMAIN_LABELS_MESSAGES } from './domain-labels.const';
import { NewTabNote } from './new-tab-note.component';
import type { OrgLike } from './org.type';
import { ResponsiveImg } from './responsive-img.component';
import { UI_MESSAGES } from './ui-text.const';

/** Summary panel of an organization (opened by OrgInfoButton): kind, nature, scope, country, hierarchy, links. */
export function OrgInfo({ org, id }: { org: OrgLike; id: string }) {
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  const ui = useText(UI_MESSAGES);
  return (
    <div className="org-info" id={id}>
      {org.image && <ResponsiveImg url={org.image} displayWidth={72} width={72} height={72} loading="lazy" />}
      <div>
        <p>
          <b>{org.name}</b>
          {org.description && <span className="muted"> · {org.description}</span>}
        </p>
        <p className="muted">
          {org.kindLabel} · {org.natureLabel} · {labels.level[org.scope]}
          {org.country && ` · ${org.country.flag} ${org.country.name}`}
        </p>
        {org.chain && org.chain.length > 1 && (
          <p className="muted">
            {ui.hierarchy}: {org.chain.map((c) => c.name).join(' › ')}
          </p>
        )}
        <p>
          {org.wikipedia ? (
            <a href={org.wikipedia} target="_blank" rel="noopener noreferrer">
              {ui.readOnWikipedia}
              <NewTabNote />
            </a>
          ) : (
            <span className="muted">{ui.noWikipedia}</span>
          )}
          {org.qid && (
            <>
              {' · '}
              <a href={`https://www.wikidata.org/wiki/${org.qid}`} target="_blank" rel="noopener noreferrer">
                Wikidata {org.qid} <span aria-hidden="true">↗</span>
                <NewTabNote />
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
