import type { Messages } from '../i18n/messages.helper';
import type { ORG_LABELS_TEXT } from './org-labels.const';

export const ORG_LABELS_TEXT_ES = {
  nature: {
    association: 'Asociación sin fines de lucro',
    company: 'Empresa',
    brand: 'Marca',
    community: 'Comunidad / cultura',
    media: 'Medios',
    unknown: 'Por clasificar',
  },
  relation: {
    member_of: 'miembro de',
    recognized_by: 'reconocida por',
    licensed_by: 'con licencia de',
    owned_by: 'pertenece a',
    affiliated_to: 'afiliada a',
  },
} satisfies Messages<typeof ORG_LABELS_TEXT>;
