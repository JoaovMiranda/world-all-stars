import { LEVEL_LABEL } from './domain-labels.const';
import type { OrgLike } from './org.type';
import { UI_TEXT } from './ui-text.const';

/** Summary panel of an organization (opened by OrgInfoButton): kind, nature, scope, country, hierarchy, links. */
export function OrgInfo({ org, id }: { org: OrgLike; id: string }) {
  return (
    <div className="org-info" id={id}>
      {org.image && <img src={org.image} alt="" loading="lazy" referrerPolicy="no-referrer" />}
      <div>
        <p>
          <b>{org.name}</b>
          {org.description && <span className="muted"> · {org.description}</span>}
        </p>
        <p className="muted">
          {org.kindLabel} · {org.natureLabel} · {LEVEL_LABEL[org.scope]}
          {org.country && ` · ${org.country.flag} ${org.country.name}`}
        </p>
        {org.chain && org.chain.length > 1 && (
          <p className="muted">
            {UI_TEXT.hierarchy}: {org.chain.map((c) => c.name).join(' › ')}
          </p>
        )}
        <p>
          {org.wikipedia ? (
            <a href={org.wikipedia} target="_blank" rel="noopener noreferrer">
              {UI_TEXT.readOnWikipedia}
            </a>
          ) : (
            <span className="muted">{UI_TEXT.noWikipedia}</span>
          )}
          {org.qid && (
            <>
              {' · '}
              <a href={`https://www.wikidata.org/wiki/${org.qid}`} target="_blank" rel="noopener noreferrer">
                Wikidata {org.qid} ↗
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
