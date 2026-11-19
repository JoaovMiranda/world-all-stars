import type { OrgNature } from '../enums/org-nature.enum';
import type { OrgRelation } from '../enums/org-relation.enum';
import { defineMessages } from '../i18n/messages.helper';
import { ORG_LABELS_TEXT_EN } from './org-labels.const.en';
import { ORG_LABELS_TEXT_ES } from './org-labels.const.es';

/** pt-BR labels of organizations (doc 19): nature, and relation to the parent; en/es next to it. */
export const ORG_LABELS_TEXT: { nature: Record<OrgNature, string>; relation: Record<OrgRelation, string>; multiSport: string } = {
  multiSport: 'Multiesportivo',
  nature: {
    association: 'Associação sem fins lucrativos',
    company: 'Empresa',
    brand: 'Marca',
    community: 'Comunidade / cultura',
    media: 'Mídia',
    unknown: 'A classificar',
  },
  relation: {
    member_of: 'membro de',
    recognized_by: 'reconhecida por',
    licensed_by: 'licenciada por',
    owned_by: 'pertence a',
    affiliated_to: 'afiliada a',
  },
};
export const ORG_LABELS_MESSAGES = defineMessages(ORG_LABELS_TEXT, { en: ORG_LABELS_TEXT_EN, es: ORG_LABELS_TEXT_ES });
