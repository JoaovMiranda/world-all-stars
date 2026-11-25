import type { Messages } from '@was/shared';

import type { TIER_VOTE_FLAGS_TEXT } from './tier-vote-flags.const';

export const TIER_VOTE_FLAGS_TEXT_ES = {
  title: 'Cuentas marcadas',
  rule: (votes) =>
    `Una ráfaga de ${votes} votos o más a un atleta en 1 hora, de cuentas con menos de 7 días, marca esas cuentas. Sus votos quedan fuera de las señales hasta la revisión.`,
  caption: 'Cuentas marcadas por la regla antifraude de los votos de nivel',
  empty: 'No hay cuentas marcadas.',
  account: 'Cuenta',
  created: 'Creada el',
  burst: 'Votos en la ráfaga',
  accountVotes: 'Votos de la cuenta',
  status: 'Estado',
  statuses: { pending: 'Pendiente de revisión', cleared: 'Liberada', rejected: 'Rechazada' },
  excluded: 'Votos fuera de la señal',
  clear: 'Liberar',
  reject: 'Rechazar',
  clearTitle: (account) => `Liberar los votos de ${account}`,
  rejectTitle: (account) => `Rechazar los votos de ${account}`,
  clearText: 'Los votos de esta cuenta vuelven a contar en las señales.',
  rejectText: 'Los votos de esta cuenta quedan fuera de las señales para siempre.',
} satisfies Messages<typeof TIER_VOTE_FLAGS_TEXT>;
