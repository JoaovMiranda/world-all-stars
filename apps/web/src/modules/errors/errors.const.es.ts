import type { Messages } from '@was/shared';

import type { ERRORS_TEXT } from './errors.const';

export const ERRORS_TEXT_ES = {
  shortcutsLabel: 'Atajos',
  searchHint: 'Usa el buscador de arriba (atajo: Ctrl+K, o ⌘K en Mac) para encontrar a un campeón por su nombre.',
  shortcuts: {
    home: { label: 'Inicio', hint: 'Globo, un día como hoy y calendario' },
    athletes: { label: 'Atletas', hint: 'Todos los campeones, con filtros' },
    sports: { label: 'Deportes', hint: 'Deportes, ligas y federaciones' },
    hallOfGreats: { label: 'Hall of Greats', hint: 'Los Míticos que cambiaron el juego' },
  },
  notFound: {
    code: '404',
    eyebrow: 'Error 404',
    title: 'Página no encontrada',
    text: 'Puede que la dirección haya cambiado o que el registro se haya eliminado. Busca a un campeón por su nombre o sigue uno de los atajos.',
    path: 'Dirección',
    home: 'Volver al inicio',
    report: 'Avisar de un enlace roto',
  },
  generic: {
    code: '!',
    eyebrow: 'Error',
    title: 'Algo salió mal',
    text: 'No se pudo mostrar esta página. Inténtalo de nuevo; si el problema continúa, avísanos desde la página Contacto.',
    retry: 'Reintentar',
    home: 'Volver al inicio',
    details: 'Detalles técnicos',
    report: 'Avisar al equipo de curaduría',
  },
} satisfies Messages<typeof ERRORS_TEXT>;
