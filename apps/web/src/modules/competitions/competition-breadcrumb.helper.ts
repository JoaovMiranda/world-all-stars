import type { CompetitionHeader } from '@was/shared';

import type { BreadcrumbItem } from '@/shared-ui/breadcrumb-item.interface';

/** Breadcrumb Sports › sport › competition, shared by the competition and edition pages (the competition links on the edition page). */
export const competitionBreadcrumb = (sports: string, c: Pick<CompetitionHeader, 'sport' | 'name' | 'slug'>, current: boolean): BreadcrumbItem[] => [
  { label: sports, link: { to: '/sports' } },
  ...(c.sport ? [{ label: c.sport.name, link: { to: '/sports/$slug' as const, params: { slug: c.sport.slug } } }] : []),
  current ? { label: c.name } : { label: c.name, link: { to: '/competitions/$competition' as const, params: { competition: c.slug } } },
];
