import type { SportPage } from '@was/shared';
import { Fragment } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { DOMAIN_LABELS_MESSAGES } from '@/shared-ui/domain-labels.const';
import { OrgName } from '@/shared-ui/org-name.component';
import { Section } from '@/shared-ui/section.component';
import { Tag } from '@/shared-ui/tag.component';

import { SPORTS_HASH, SPORTS_MESSAGES } from './sports.const';

/** "Who rules / The pinnacle / Environment" (doc 18/19): governance chains with Wikipedia links, pinnacle, prize forms. */
export function SportGovernance({ sport }: { sport: SportPage }) {
  const t = useText(SPORTS_MESSAGES).page;
  const sportsText = useText(SPORTS_MESSAGES);
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  const env = sportsText.environment[sport.environment];
  return (
    <Section title={t.whoRules} className="sport-governance">
      <div className="gov-grid">
        <div>
          <b className="gov-value">{sport.governanceInfo?.name ?? t.dash}</b>
          {sport.governanceInfo && <p className="muted">{sport.governanceInfo.summary}</p>}
          {sport.bodies.length > 0 && (
            <ul className="gov-chains">
              {sport.bodies.map((b) => {
                const self = b.chain.at(-1);
                return (
                  <li key={`${b.role}-${b.name}`}>
                    <span className="muted">{labels.orgRole[b.role] ?? b.role}:</span>{' '}
                    {b.chain.map((c, i) => (
                      <Fragment key={c.id}>
                        {i > 0 && (
                          <span className="rel" title={c.relationLabel ?? undefined}>
                            <span aria-hidden="true">›</span>
                            {c.relationLabel && <span className="sr-only">{c.relationLabel}</span>}
                          </span>
                        )}{' '}
                        <span className={i === b.chain.length - 1 ? 'chain-self' : 'muted'}>
                          <OrgName org={c} />
                        </span>{' '}
                      </Fragment>
                    ))}
                    {self && <Tag tone="soft">{self.natureLabel}</Tag>}
                  </li>
                );
              })}
            </ul>
          )}
          <a className="label" href={`#${SPORTS_HASH.associations}`}>
            {t.seeAssociations}
          </a>
        </div>
        <div>
          <span className="label">{t.pinnacle}</span>
          <b className="gov-value pinnacle">{sport.pinnacle ?? t.dash}</b>
          <span className="label mt-2.5 block">{t.prizeForms}</span>
          <div className="row mt-1">
            {sport.prizeForms.length > 0
              ? sport.prizeForms.map((f) => (
                  <Tag key={f} tone="soft">
                    {sportsText.prizeForm[f] ?? f}
                  </Tag>
                ))
              : t.dash}
          </div>
        </div>
        <div>
          <span className="label">{t.environment}</span>
          <b className="gov-value">
            {env?.name ?? t.dash} · {sportsText.format[sport.format] ?? t.dash}
          </b>
          {env && <p className="muted">{env.summary}</p>}
        </div>
      </div>
    </Section>
  );
}
