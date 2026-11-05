import { ACCESS_LOG_RETENTION_MONTHS, ACCOUNT_MIN_AGE, CONTACT_RETENTION_MONTHS } from '@was/shared';

import type { DocumentContent } from '@/shared-ui/document-page-layout.component';

// UI strings and contents of the legal module (pt-BR, ready to become an i18n namespace). Source: plan/docs/13 and 14.
// Technical draft, NOT legal advice: the final texts need a lawyer's review and the company (CNPJ) definition.

/** Placeholders that stay visible until the company is defined (doc 13, "Riscos / pendências"). */
export const LEGAL_PENDING = {
  controller: '[PENDENTE: razão social, CNPJ e endereço da pessoa jurídica]',
  privacyEmail: '[PENDENTE: e-mail do canal de privacidade, ex.: privacidade@dominio]',
  forum: '[PENDENTE: comarca do foro, a definir com a sede da pessoa jurídica]',
} as const;

export const LEGAL_TEXT = {
  eyebrow: 'Legal',
  draftNotice:
    'Rascunho técnico (versão 0.x) a partir do plano de privacidade do projeto. Antes do lançamento, o texto passa por revisão de um advogado e os campos marcados como PENDENTE serão preenchidos.',
  actions: {
    contactPrivacy: 'Falar com a curadoria sobre privacidade',
    myData: 'Meus dados (exportar ou excluir conta)',
    cookies: 'Política de cookies',
    privacy: 'Aviso de privacidade',
    terms: 'Termos de uso',
    contact: 'Relatar uma barreira',
  },
} as const;

export const PRIVACY_DOC: DocumentContent = {
  title: 'Aviso de privacidade',
  eyebrow: LEGAL_TEXT.eyebrow,
  lead: 'Quais dados pessoais o World All Stars trata, para quê, com qual base legal, por quanto tempo e como você exerce seus direitos (LGPD, Lei 13.709/2018).',
  sections: [
    {
      id: 'controlador',
      title: 'Quem somos',
      blocks: [
        { kind: 'p', text: 'O World All Stars é uma enciclopédia gratuita dos maiores campeões de todos os esportes. O controlador dos dados pessoais é:' },
        { kind: 'notice', tone: 'warning', text: LEGAL_PENDING.controller },
      ],
    },
    {
      id: 'canal',
      title: 'Canal do titular',
      blocks: [
        {
          kind: 'p',
          text: 'Para qualquer pedido sobre seus dados (acesso, correção, exclusão, portabilidade, oposição ou revogação de consentimento), use o assunto “Privacidade (LGPD)” na página Contato ou escreva para o canal de privacidade. Como agente de pequeno porte (Res. CD/ANPD nº 2/2022), podemos não ter encarregado formal, mas o canal é garantido.',
        },
        { kind: 'notice', tone: 'warning', text: LEGAL_PENDING.privacyEmail },
      ],
    },
    {
      id: 'dados',
      title: 'Quais dados, para quê e com qual base legal',
      blocks: [
        {
          kind: 'table',
          caption: 'Mapa de dados pessoais: titular, dados, finalidade, base legal e retenção',
          headers: ['Titular', 'Dados', 'Finalidade', 'Base legal (art. 7º)', 'Retenção'],
          rows: [
            ['Visitante', 'IP, data e hora, endereço acessado, navegador (registros de acesso)', 'Segurança e obrigação do Marco Civil', 'Obrigação legal (II)', `${ACCESS_LOG_RETENTION_MONTHS} meses, depois apagados`],
            ['Visitante', 'Cookies essenciais (tema, idioma, sessão, consentimento)', 'Funcionamento do site', 'Legítimo interesse (IX)', 'Da sessão a 12 meses'],
            ['Visitante', 'Cookies de medição e de anúncios (se ativados)', 'Estatística e monetização', 'Consentimento (I)', 'Conforme o fornecedor; revogável'],
            ['Leitor com conta', 'E-mail, nome, avatar, hash da senha, sessões, idioma, tema', 'Criar e manter a conta, notificações', 'Execução de contrato (V)', 'Até a exclusão da conta, depois anonimização'],
            ['Leitor com conta', 'Votos de tier, comentários e reações', 'Comunidade e moderação', 'Execução de contrato (V) e legítimo interesse (IX)', 'Permanente, sob pseudônimo após a exclusão'],
            ['Atletas', 'Nome, nascimento, nacionalidade, carreira, foto com licença livre', 'Enciclopédia sobre figuras públicas', 'Legítimo interesse (IX); dados tornados públicos (art. 7º, §4º)', 'Enquanto relevante; correção e oposição a pedido'],
            ['Quem usa o Contato', 'Atleta sugerido, links, justificativa, nome e e-mail', 'Avaliar a sugestão e responder a mensagem', 'Legítimo interesse (IX)', `${CONTACT_RETENTION_MONTHS} meses após a decisão ou o encerramento`],
          ],
        },
        {
          kind: 'p',
          text: 'Atletas também são titulares: eles ou seus herdeiros podem pedir correção, oposição ou remoção pelo Contato, com prioridade na análise.',
        },
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies',
      blocks: [
        {
          kind: 'p',
          text: 'Usamos só cookies necessários por padrão. Cookies de medição e de anúncios dependem do seu consentimento, que você pode revogar a qualquer momento. Os detalhes estão na Política de cookies.',
        },
      ],
    },
    {
      id: 'compartilhamento',
      title: 'Com quem compartilhamos (operadores)',
      blocks: [
        {
          kind: 'list',
          items: [
            'Cloudflare: rede de entrega e proteção contra ataques.',
            'Fly.io: servidor da aplicação.',
            'Neon: banco de dados.',
            'Resend: envio de e-mails.',
            'Sentry: registro de erros.',
            'Google e Meta: só se houver medição ou anúncios, e só com consentimento.',
            'Wikimedia: imagens de atletas carregadas por link, até a entrada do proxy de imagens.',
          ],
        },
      ],
    },
    {
      id: 'transferencia',
      title: 'Transferência internacional',
      blocks: [
        {
          kind: 'p',
          text: 'Alguns operadores processam dados fora do Brasil. Essas transferências seguem o art. 33 da LGPD, com cláusulas contratuais de proteção.',
        },
      ],
    },
    {
      id: 'retencao',
      title: 'Por quanto tempo guardamos',
      blocks: [
        {
          kind: 'list',
          items: [
            `Registros de acesso (IP, data e hora): ${ACCESS_LOG_RETENTION_MONTHS} meses, cifrados e com acesso só por ordem judicial (Marco Civil, art. 15).`,
            'Conta: enquanto existir. Ao excluir, nome e e-mail são apagados e os comentários e votos ficam sob um pseudônimo (“Usuário removido #1234”).',
            `Sugestões e mensagens do Contato: ${CONTACT_RETENTION_MONTHS} meses após a decisão ou o encerramento.`,
          ],
        },
      ],
    },
    {
      id: 'direitos',
      title: 'Seus direitos',
      blocks: [
        {
          kind: 'p',
          text: 'Pelo art. 18 da LGPD, você pode pedir: confirmação de que tratamos seus dados, acesso, correção, anonimização ou eliminação, portabilidade, informação sobre compartilhamento, revogação do consentimento e oposição. Quem tem conta exporta os dados e exclui a conta sozinho, em Meus dados. Respondemos aos demais pedidos em até 15 dias.',
        },
      ],
    },
    {
      id: 'seguranca',
      title: 'Segurança',
      blocks: [
        {
          kind: 'p',
          text: 'Criptografia em trânsito (HTTPS), senhas guardadas só como hash, acesso restrito por papel, registros de auditoria e backups cifrados.',
        },
      ],
    },
    {
      id: 'anuncios',
      title: 'Anúncios',
      blocks: [
        {
          kind: 'p',
          text: 'Hoje o site não exibe anúncios. Se passar a exibir, fornecedores terceiros, incluindo o Google, poderão usar cookies para mostrar anúncios com base em visitas anteriores, sempre depois do seu consentimento. Esta seção vai listar os parceiros e os links de desativação (Configurações de anúncios do Google, aboutads.info).',
        },
      ],
    },
    {
      id: 'menores',
      title: 'Crianças e adolescentes',
      blocks: [
        { kind: 'p', text: `O site não é direcionado a menores. Ler não exige conta; contas são só para maiores de ${ACCOUNT_MIN_AGE} anos.` },
      ],
    },
    {
      id: 'alteracoes',
      title: 'Alterações deste aviso',
      blocks: [
        {
          kind: 'p',
          text: 'Cada versão tem número e data de vigência. Mudanças relevantes são avisadas com antecedência no site e, para quem tem conta, por e-mail.',
        },
      ],
    },
  ],
};

export const TERMS_DOC: DocumentContent = {
  title: 'Termos de uso',
  eyebrow: LEGAL_TEXT.eyebrow,
  lead: 'As regras para ler, votar, comentar e sugerir atletas no World All Stars.',
  sections: [
    {
      id: 'servico',
      title: 'Aceitação e serviço',
      blocks: [
        {
          kind: 'p',
          text: 'O World All Stars é uma enciclopédia gratuita dos maiores campeões de esportes físicos, mentais e eletrônicos. Ao usar o site, você concorda com estes Termos e com o Aviso de privacidade. Ler não exige conta.',
        },
      ],
    },
    {
      id: 'contas',
      title: 'Contas',
      blocks: [
        {
          kind: 'list',
          items: [
            `Só para maiores de ${ACCOUNT_MIN_AGE} anos (declaração no cadastro).`,
            'Uma conta por pessoa; você cuida da segurança da sua senha.',
            'Contas que abusam das regras podem ser suspensas.',
            'Com conta, você vota no tier dos atletas e comenta. Ninguém edita os dados do site.',
          ],
        },
      ],
    },
    {
      id: 'participacao',
      title: 'Votos, comentários e sugestões',
      blocks: [
        {
          kind: 'list',
          items: [
            'Os dados vêm das fontes coletadas e da curadoria. Votos são opinião da comunidade; quem decide o tier oficial é a curadoria.',
            'Comentários têm até 500 caracteres. É proibido conteúdo falso, difamatório, discriminatório, com dados pessoais sensíveis, spam ou que viole direitos autorais.',
            'Sugestões de atleta precisam de link de fonte e passam pela curadoria antes de qualquer coleta.',
            'Ao publicar, você licencia o seu texto sob CC BY-SA 4.0, compatível com as fontes Wikipedia e Liquipedia.',
          ],
        },
      ],
    },
    {
      id: 'licencas',
      title: 'Conteúdo de terceiros e licenças',
      blocks: [
        {
          kind: 'p',
          text: 'Imagens e textos de terceiros mantêm as próprias licenças (veja a página Fontes). Marcas pertencem aos respectivos donos.',
        },
      ],
    },
    {
      id: 'precisao',
      title: 'Precisão dos dados',
      blocks: [
        {
          kind: 'p',
          text: 'Buscamos exatidão com fonte em cada dado, mas não garantimos que tudo esteja correto. Para corrigir, use o assunto “Erro em um dado” no Contato, com o link da fonte correta: a correção acontece na fonte e chega pela coleta.',
        },
      ],
    },
    {
      id: 'remocao',
      title: 'Notificação e remoção',
      blocks: [
        {
          kind: 'p',
          text: 'Atletas, herdeiros e titulares de direitos podem pedir correção ou remoção pelo Contato. Cada pedido é analisado em até 15 dias.',
        },
      ],
    },
    {
      id: 'propriedade',
      title: 'Propriedade intelectual',
      blocks: [{ kind: 'p', text: 'Marca, design e código do site são do World All Stars, separados do conteúdo licenciado de terceiros.' }],
    },
    {
      id: 'responsabilidade',
      title: 'Limitação de responsabilidade e links externos',
      blocks: [
        {
          kind: 'p',
          text: 'O site aponta para fontes externas que não controlamos. Não respondemos pelo conteúdo delas nem por decisões tomadas só com base nos dados daqui.',
        },
      ],
    },
    {
      id: 'alteracoes',
      title: 'Alterações dos Termos',
      blocks: [
        {
          kind: 'p',
          text: 'Cada versão tem número e data. Quem tem conta é avisado e precisa aceitar a nova versão para continuar votando e comentando.',
        },
      ],
    },
    {
      id: 'lei',
      title: 'Lei aplicável e foro',
      blocks: [
        {
          kind: 'p',
          text: 'Vale a legislação brasileira. Quando se aplicar o Código de Defesa do Consumidor, o foro é o do seu domicílio.',
        },
        { kind: 'notice', tone: 'warning', text: LEGAL_PENDING.forum },
      ],
    },
    {
      id: 'contato',
      title: 'Contato',
      blocks: [{ kind: 'notice', tone: 'warning', text: LEGAL_PENDING.controller }],
    },
  ],
};

export const COOKIES_DOC: DocumentContent = {
  title: 'Política de cookies',
  eyebrow: LEGAL_TEXT.eyebrow,
  lead: 'Quais cookies o site usa, por quanto tempo e como você escolhe (guia de cookies da ANPD).',
  sections: [
    {
      id: 'o-que-sao',
      title: 'O que são cookies',
      blocks: [
        {
          kind: 'p',
          text: 'Cookies e armazenamento local são pequenos dados guardados no seu navegador. Alguns são necessários para o site funcionar; outros só entram se você aceitar.',
        },
      ],
    },
    {
      id: 'categorias',
      title: 'Categorias',
      blocks: [
        {
          kind: 'table',
          caption: 'Categorias de cookies: finalidade, base legal e se vêm marcadas',
          headers: ['Categoria', 'Para quê', 'Base legal', 'Padrão'],
          rows: [
            ['Necessários', 'Tema claro/escuro, idioma, sessão de quem tem conta, registro da sua escolha de cookies', 'Legítimo interesse', 'Sempre ativos'],
            ['Medição', 'Estatística de visitas. Preferimos medição sem cookies (Plausible ou Umami)', 'Consentimento', 'Desligado'],
            ['Anúncios', 'Só se o site passar a exibir anúncios', 'Consentimento', 'Desligado'],
          ],
        },
      ],
    },
    {
      id: 'lista',
      title: 'Lista de cookies e fornecedores',
      blocks: [
        {
          kind: 'table',
          caption: 'Cookies em uso: nome, fornecedor, finalidade e duração',
          headers: ['Nome', 'Fornecedor', 'Finalidade', 'Duração'],
          rows: [
            ['was-theme', 'World All Stars', 'Lembrar o tema escolhido', 'Até você limpar o navegador'],
            ['sessão', 'World All Stars', 'Manter você conectado', 'Até sair ou 30 dias'],
            ['consentimento', 'World All Stars', 'Guardar suas escolhas de cookies', '12 meses'],
            ['WMF-Uniq', 'Wikimedia (terceiro)', 'Definido ao carregar fotos hotlinkadas', 'Conforme a Wikimedia; some com o proxy de imagens'],
          ],
        },
      ],
    },
    {
      id: 'escolhas',
      title: 'Como escolher e revogar',
      blocks: [
        {
          kind: 'list',
          items: [
            'O banner tem “Aceitar todos”, “Rejeitar não essenciais” e “Personalizar”, com o mesmo destaque.',
            'Nenhuma categoria opcional vem marcada, e nenhum script não essencial roda antes da sua escolha.',
            'Você muda a escolha a qualquer momento em “Preferências de cookies”, no rodapé. Quem tem conta também pode revogar em Meus dados.',
            'Também é possível bloquear cookies nas configurações do navegador.',
          ],
        },
        { kind: 'notice', tone: 'info', text: 'O banner e a central de cookies ainda serão implementados (P19b). Hoje o site usa só armazenamento necessário.' },
      ],
    },
  ],
};

export const ACCESSIBILITY_DOC: DocumentContent = {
  title: 'Declaração de acessibilidade',
  eyebrow: 'Compromisso',
  lead: 'O World All Stars segue o WCAG 2.2 nível AA. Veja como o site é testado, o que ainda falta e como relatar uma barreira.',
  sections: [
    {
      id: 'padrao',
      title: 'Padrão adotado',
      blocks: [
        {
          kind: 'p',
          text: 'Seguimos as Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.2, nível AA, com o eMAG como referência nacional, como pede a Lei Brasileira de Inclusão (Lei 13.146/2015, art. 63).',
        },
      ],
    },
    {
      id: 'auditoria',
      title: 'Última auditoria',
      blocks: [
        {
          kind: 'p',
          text: 'Auditoria com Lighthouse 12.6.1 (perfil mobile) nos temas claro e escuro, em 03 e 04/11/2026, sobre o protótipo:',
        },
        {
          kind: 'table',
          caption: 'Resultados do Lighthouse por página (acessibilidade e SEO)',
          headers: ['Página', 'Acessibilidade', 'SEO'],
          rows: [
            ['Início', '100', '100'],
            ['Perfil do atleta (claro e escuro)', '100', '100'],
            ['Esporte', '100', '100'],
            ['Hall of Greats', '100', '100'],
            ['Atletas', '100', '100'],
            ['Fontes', '100', '100'],
          ],
        },
      ],
    },
    {
      id: 'recursos',
      title: 'O que o site oferece',
      blocks: [
        {
          kind: 'list',
          items: [
            'Navegação completa por teclado, com foco sempre visível e não coberto pelo cabeçalho.',
            'Atalho “Pular para o conteúdo” e um único título principal por página.',
            'Contraste mínimo de 4,5:1 nos dois temas; cor nunca é o único sinal (tier e nível têm texto).',
            'Abas, calendário e globo operáveis por teclado; o globo tem lista de países equivalente.',
            'Gráficos com tabela equivalente dos mesmos dados.',
            'Formulários com rótulos visíveis, erros em texto embaixo de cada campo e foco no primeiro erro.',
            'Layout sem rolagem horizontal até 320 px e texto ampliável até 200%.',
            'Animações curtas, desligadas quando o sistema pede movimento reduzido.',
          ],
        },
      ],
    },
    {
      id: 'limitacoes',
      title: 'Limitações conhecidas',
      blocks: [
        {
          kind: 'list',
          items: [
            'Barras douradas dos gráficos têm contraste baixo no tema claro: os mesmos dados estão em tabela ao lado.',
            'Fotos vêm de links externos (Wikimedia) e podem demorar a carregar; o nome do atleta está sempre em texto.',
            'O site está só em português por enquanto; inglês e espanhol estão planejados.',
          ],
        },
      ],
    },
    {
      id: 'testes',
      title: 'Como testamos',
      blocks: [
        {
          kind: 'list',
          items: [
            'A cada mudança: Lighthouse e axe-core automáticos, com zero violações sérias ou críticas.',
            'A cada versão: navegação só com teclado, leitores de tela NVDA e VoiceOver, zoom de 200% e 400%, alto contraste e celulares reais.',
          ],
        },
      ],
    },
    {
      id: 'relatar',
      title: 'Relatar uma barreira',
      blocks: [
        {
          kind: 'p',
          text: 'Encontrou algo que impede ou dificulta o uso? Mande uma mensagem pelo Contato, com o assunto “Outro assunto”, dizendo a página e o que aconteceu. Respondemos em até 5 dias úteis.',
        },
      ],
    },
  ],
};

/** Date of the last accessibility audit (doc 14). */
export const ACCESSIBILITY_AUDITED_AT = '2026-11-04';
