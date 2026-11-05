import type { OrgNature } from '../enums/org-nature.enum';
import type { OrgRelation } from '../enums/org-relation.enum';

/** pt-BR label of each organization nature (doc 19). */
export const ORG_NATURE_LABELS: Record<OrgNature, string> = {
  association: 'Associação sem fins lucrativos',
  company: 'Empresa',
  brand: 'Marca',
  community: 'Comunidade / cultura',
  media: 'Mídia',
  unknown: 'A classificar',
};

/** pt-BR label of the relation of an organization to its parent (doc 19). */
export const ORG_RELATION_LABELS: Record<OrgRelation, string> = {
  member_of: 'membro de',
  recognized_by: 'reconhecida por',
  licensed_by: 'licenciada por',
  owned_by: 'pertence a',
  affiliated_to: 'afiliada a',
};
