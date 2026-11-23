import type { CompetitionLevel } from '../enums/competition-level.enum';
import type { GovernanceModel } from '../enums/governance-model.enum';
import type { OrgNature } from '../enums/org-nature.enum';
import type { OrgTreeNode, SportAssociation } from '../types/organization.type';
import type { SportCompetition } from '../types/sport-page.type';
import type { SportCard, SportGroup } from '../types/sports-tree.type';
import { normalizeForSearch } from './text-normalize.helper';

/**
 * Associations shown on a sport card (doc 19): the governing ones first (already ordered from the top of the
 * hierarchy down); when none governs, the organizers. At most `limit`.
 */
export const featuredAssociations = <T extends Pick<SportAssociation, 'governs'>>(associations: readonly T[], limit: number): T[] => {
  const governing = associations.filter((a) => a.governs);
  return (governing.length > 0 ? governing : associations).slice(0, limit);
};

/** /sports search: matches the sport name, its taxonomy or ANY association name ("UFC" finds MMA). */
export const matchesSportSearch = (sport: SportCard, q: unknown): boolean => {
  const needle = normalizeForSearch(q);
  if (!needle) return true;
  return [sport.name, sport.group, sport.subgroup, ...sport.associations.map((a) => a.name)].some((t) => normalizeForSearch(t).includes(needle));
};

/** Filters the sports tree by search and governance model, dropping empty subgroups and groups. */
export const filterSportsTree = (
  tree: readonly SportGroup[],
  filters: { q?: string | undefined; governance?: GovernanceModel | undefined; programme?: string | undefined },
): SportGroup[] =>
  tree
    .map((g) => ({
      ...g,
      subgroups: g.subgroups
        .map((s) => ({
          ...s,
          sports: s.sports.filter(
            (sp) =>
              (!filters.governance || sp.governance === filters.governance) &&
              (!filters.programme || (sp.programmes ?? []).some((p) => p.slug === filters.programme)) &&
              matchesSportSearch(sp, filters.q),
          ),
        }))
        .filter((s) => s.sports.length > 0),
    }))
    .filter((g) => g.subgroups.length > 0);

/** Number of sports in a (filtered) tree. */
export const countSports = (tree: readonly SportGroup[]): number => tree.reduce((n, g) => n + g.subgroups.reduce((m, s) => m + s.sports.length, 0), 0);

/** Number of organizations in a hierarchy (every node, recursively). */
export const countOrgTree = (nodes: readonly OrgTreeNode[]): number => nodes.reduce((n, o) => n + 1 + countOrgTree(o.children), 0);

/** Keeps the nodes of the given nature AND the ancestors needed to reach them (the hierarchy stays readable). */
export const filterOrgTree = (nodes: readonly OrgTreeNode[], nature: OrgNature | undefined): OrgTreeNode[] => {
  if (!nature) return [...nodes];
  return nodes.flatMap((n) => {
    const children = filterOrgTree(n.children, nature);
    return n.nature === nature || children.length > 0 ? [{ ...n, children }] : [];
  });
};

/** Sport page (doc 09 P7): competitions by level + search over name and organizer. */
export const matchesCompetitionFilters = (c: SportCompetition, filters: { q?: string | undefined; level?: CompetitionLevel | undefined }): boolean => {
  const needle = normalizeForSearch(filters.q);
  return (!filters.level || c.level === filters.level) && (!needle || normalizeForSearch(`${c.name} ${c.org}`).includes(needle));
};
