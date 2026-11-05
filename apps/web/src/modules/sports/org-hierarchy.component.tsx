import { countOrgTree, filterOrgTree, ORG_NATURE_VALUES, type OrgNature, type OrgTreeNode } from '@was/shared';
import { Link } from '@tanstack/react-router';
import { Fragment, useEffect, useState } from 'react';

import { ChipToggleGroup } from '@/shared-ui/chip-toggle-group.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { LevelTag } from '@/shared-ui/level-tag.component';
import { OrgRow } from '@/shared-ui/org-row.component';
import { Tag } from '@/shared-ui/tag.component';
import { useHashScroll } from '@/shared-ui/use-hash-scroll.hook';

import { ORG_NATURE_LABEL, SPORTS_HASH, SPORTS_TEXT } from './sports.const';

const t = SPORTS_TEXT.hierarchy;
const HIERARCHY_HASH = SPORTS_HASH.hierarchy;
const NATURE_OPTIONS = ORG_NATURE_VALUES.map((value) => ({
  value,
  label: ORG_NATURE_LABEL[value],
}));

function OrgTreeItem({ node }: { node: OrgTreeNode }) {
  return (
    <OrgRow
      org={node}
      className="org-tree-node"
      lead={node.relationLabel && <span className="org-rel">{t.relationUp(node.relationLabel)}</span>}
      tags={
        <>
          <Tag tone="soft">{node.kindLabel}</Tag>
          <LevelTag level={node.scope} />
        </>
      }
    >
      {node.sports.length > 0 && (
        <p className="org-tree-meta">
          {t.governs}:{' '}
          {node.sports.map((s, i) => (
            <Fragment key={s.slug}>
              {i > 0 && ', '}
              <Link to="/sports/$slug" params={{ slug: s.slug }}>
                {s.name}
              </Link>
            </Fragment>
          ))}
        </p>
      )}
      {node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <OrgTreeItem key={c.id} node={c} />
          ))}
        </ul>
      )}
    </OrgRow>
  );
}

interface OrgHierarchyProps {
  orgs: readonly OrgTreeNode[];
  nature: OrgNature | undefined;
  onNatureChange: (nature: OrgNature | undefined) => void;
}

/** Collapsible "Hierarquia completa" (#hierarquia, old Organizations page): full org tree + nature filter + ⓘ. */
export function OrgHierarchy({ orgs, nature, onNatureChange }: OrgHierarchyProps) {
  const targeted = useHashScroll() === HIERARCHY_HASH;
  const [open, setOpen] = useState(targeted || nature !== undefined);
  useEffect(() => {
    if (targeted) setOpen(true);
  }, [targeted]);
  const visible = filterOrgTree(orgs, nature);

  return (
    <details id={HIERARCHY_HASH} className="card org-hierarchy" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        <h2>{t.title}</h2>
        <span className="label">{t.count(countOrgTree(orgs), orgs.length)}</span>
      </summary>
      {orgs.length === 0 ? (
        <EmptyState title={t.emptyTitle} compact>
          {t.emptyText}
        </EmptyState>
      ) : (
        <>
          <p className="muted my-3">{t.intro}</p>
          <ChipToggleGroup label={t.natureLabel} options={NATURE_OPTIONS} value={nature} onChange={onNatureChange} />
          {visible.length > 0 ? (
            <ul className="org-tree mt-3.5">
              {visible.map((n) => (
                <OrgTreeItem key={n.id} node={n} />
              ))}
            </ul>
          ) : (
            <p className="empty">{t.noMatch}</p>
          )}
        </>
      )}
    </details>
  );
}
