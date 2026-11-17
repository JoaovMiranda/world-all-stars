/** Cookie of the simulated session kind (doc 17: anon · reader · admin), also read by the API. `?as=` overrides it. */
export const SESSION_COOKIE = 'was_session';
/** Legacy localStorage key (before SSR): migrated to the cookie once, then removed. */
export const SESSION_STORAGE_KEY = 'was-session';
export const SESSION_URL_PARAM = 'as';

// UI strings of the session menu and login placeholder (pt-BR, ready for i18n).
export const SESSION_TEXT = {
  menuLabel: 'Sessão simulada',
  profiles: { anon: 'Visitante (sem conta)', reader: 'Leitor com conta', admin: 'Admin' },
  signIn: 'Entrar',
  resetDemo: 'Limpar votos, comentários e mudanças da demo',
  hint: 'Protótipo: não há login real. Escolha um perfil para testar.',
  myProfile: 'Meu perfil',
  notifications: 'Notificações',
  myData: 'Meus dados',
  admin: 'Painel admin',
  loginKicker: 'Conta',
  loginTitle: (reason: string) => `Entre para ${reason}`,
  loginText: 'A tela de login ainda será desenhada (handoff E1). Por enquanto, simule a entrada como leitor.',
  loginCancel: 'Agora não',
  loginConfirm: 'Simular entrada como leitor',
  reasons: {
    vote: 'votar no nível do atleta',
    comment: 'comentar',
    reply: 'responder',
    react: 'curtir ou descurtir comentários',
    account: 'ver sua conta',
    default: 'continuar',
  },
} as const;
export type LoginReason = keyof typeof SESSION_TEXT.reasons;
