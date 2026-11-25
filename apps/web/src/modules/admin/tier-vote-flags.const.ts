// UI strings of the flagged accounts of the "Tier signals" tab (T3.2; pt-BR source, en/es next to it).
import { defineMessages } from '@was/shared';

import { TIER_VOTE_FLAGS_TEXT_EN } from './tier-vote-flags.const.en';
import { TIER_VOTE_FLAGS_TEXT_ES } from './tier-vote-flags.const.es';

export const TIER_VOTE_FLAGS_TEXT = {
  title: 'Contas sinalizadas',
  rule: (votes: number) =>
    `Uma rajada de ${votes} votos ou mais num atleta em 1 hora, vindos de contas com menos de 7 dias, sinaliza essas contas. Os votos delas ficam fora dos sinais até a revisão.`,
  caption: 'Contas sinalizadas pela regra antifraude dos votos de tier',
  empty: 'Nenhuma conta sinalizada.',
  account: 'Conta',
  created: 'Criada em',
  burst: 'Votos na rajada',
  accountVotes: 'Votos da conta',
  status: 'Situação',
  statuses: { pending: 'Aguardando revisão', cleared: 'Liberada', rejected: 'Recusada' },
  excluded: 'Votos fora do sinal',
  clear: 'Liberar',
  reject: 'Recusar',
  clearTitle: (account: string) => `Liberar os votos de ${account}`,
  rejectTitle: (account: string) => `Recusar os votos de ${account}`,
  clearText: 'Os votos desta conta voltam a contar nos sinais.',
  rejectText: 'Os votos desta conta ficam fora dos sinais de vez.',
};

export const TIER_VOTE_FLAGS_MESSAGES = defineMessages(TIER_VOTE_FLAGS_TEXT, { en: TIER_VOTE_FLAGS_TEXT_EN, es: TIER_VOTE_FLAGS_TEXT_ES });
