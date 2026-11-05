import { countSports, featuredAssociations, SPORT_CARD_ASSOCIATIONS_LIMIT, type SportGroup } from '@was/shared';
import { Link } from '@tanstack/react-router';

import { SportCard } from '@/shared-ui/sport-card.component';
import { Tag } from '@/shared-ui/tag.component';

import { GOVERNANCE_LABEL, SPORTS_HASH, SPORTS_TEXT } from './sports.const';

const t = SPORTS_TEXT.list;

/** Groups › subgroups › SportCards (whole card → sport page; association names → Wikipedia). */
export function SportDirectory({ groups }: { groups: readonly SportGroup[] }) {
  return (
    <div className="sport-directory">
      {groups.map((g) => (
        <section key={g.slug} className="sport-group" aria-labelledby={`group-${g.slug}`}>
          <div className="sport-group-head">
            <h2 id={`group-${g.slug}`}>{g.name}</h2>
            <span className="label">{t.groupCount(countSports([g]))}</span>
          </div>
          {g.subgroups.map((sub) => (
            <div key={sub.slug} className="sport-subgroup">
              <h3 className="label">{sub.name}</h3>
              <ul className="sport-grid">
                {sub.sports.map((s) => {
                  const shown = featuredAssociations(s.associations, SPORT_CARD_ASSOCIATIONS_LIMIT);
                  const hasMore = s.associations.length > shown.length;
                  return (
                    <li key={s.slug}>
                      <SportCard
                        sport={s}
                        associations={shown}
                        associationsLabel={t.associations(s.associations.length)}
                        tags={s.governance && <Tag tone="soft">{GOVERNANCE_LABEL[s.governance]}</Tag>}
                        footer={
                          <>
                            {s.associations.length === 0 && <p className="muted">{t.noAssociations}</p>}
                            <Link className="block mt-2" to="/sports/$slug" params={{ slug: s.slug }} {...(hasMore ? { hash: SPORTS_HASH.associations } : {})}>
                              {hasMore ? t.seeAll(s.associations.length) : t.seeSport}
                            </Link>
                          </>
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
