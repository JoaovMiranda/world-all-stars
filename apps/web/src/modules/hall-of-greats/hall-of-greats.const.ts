// UI strings of the hall-of-greats module (pt-BR, ready to become an i18n namespace).
export const HALL_OF_GREATS_TEXT = {
  page: {
    title: 'Hall of Greats',
    heading: 'Os que mudaram o jogo',
    eyebrow: 'Hall of Greats',
    lead: 'Não basta ganhar tudo: para entrar no Hall, o campeão precisa ter mudado o próprio esporte. Cada nome tem um dossiê público com evidências e fontes.',
  },
  rules: {
    label: 'Regras de entrada',
    items: [
      { title: '1. Nível Mítico', text: 'Só atletas classificados como Míticos. O nível nunca é automático.' },
      { title: '2. Dossiê "Mudou o jogo"', text: 'Pelo menos 2 evidências (recorde histórico, técnica, mudança de regra, popularização, reconhecimento), cada uma com fonte.' },
      { title: '3. Dupla aprovação', text: 'Dois admins aprovam o dossiê. Tudo fica versionado.' },
    ],
  },
  legends: {
    label: 'Os Míticos do Hall',
    evidences: (n: number) => (n === 1 ? '1 evidência' : `${n} evidências`),
    approvals: (n: number) => (n === 1 ? '1 aprovação' : `${n} aprovações`),
    emptyTitle: 'Nenhum Mítico no Hall ainda',
    emptyText: 'O Hall recebe só atletas Míticos com dossiê aprovado por dois admins. Os primeiros nomes aparecem aqui assim que forem consagrados.',
    emptyAction: 'Como alguém vira Mítico',
  },
  queue: {
    title: 'Na fila: Lendários sem dossiê',
    eyebrow: 'a curadoria prepara o dossiê',
    emptyTitle: 'Ninguém na fila',
    emptyText: 'Quando um Lendário for indicado ao Hall, ele aparece aqui enquanto a curadoria prepara o dossiê.',
  },
} as const;
