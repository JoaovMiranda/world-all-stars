import { APP_COOKIE, defineMessages, AUTH_BASE_PATH as SHARED_AUTH_BASE_PATH } from '@was/shared';

import { SESSION_TEXT_EN } from './session.const.en';
import { SESSION_TEXT_ES } from './session.const.es';

/** Cookie of the simulated session kind (dev switcher: anon · reader · admin), also read by the API. `?as=` overrides it. */
export const SESSION_COOKIE = APP_COOKIE.session;
/** Legacy localStorage key (before SSR): migrated to the cookie once, then removed. */
export const SESSION_STORAGE_KEY = 'was-session';
export const SESSION_URL_PARAM = 'as';
/** Better Auth on the same origin (Google sign-in, callback, sign-out). */
export const AUTH_BASE_PATH = SHARED_AUTH_BASE_PATH;
/** Query params Better Auth appends to the errorCallbackURL when a sign-in fails (`error` = code first). */
export const AUTH_ERROR_PARAMS = ['error', 'error_description'] as const;

// UI strings of the session menu, login and consent dialogs (pt-BR source; en/es next to it).
export const SESSION_TEXT = {
  menuLabel: 'Sessão simulada',
  profiles: { anon: 'Visitante (sem conta)', reader: 'Leitor com conta', admin: 'Admin' },
  signIn: 'Entrar',
  signOut: 'Sair',
  accountMenu: (name: string) => `Conta de ${name}`,
  signedInAs: (email: string) => `Conectado como ${email}`,
  resetDemo: 'Limpar votos, comentários e mudanças da demo',
  hint: 'Desenvolvimento: troque de perfil de demonstração sem login real.',
  myProfile: 'Meu perfil',
  notifications: 'Notificações',
  myData: 'Meus dados',
  admin: 'Painel admin',
  loginKicker: 'Conta',
  loginTitle: (reason: string) => `Entre para ${reason}`,
  loginText: 'Use sua conta Google. Recebemos só seu nome, e-mail e foto do perfil.',
  loginGoogle: 'Entrar com Google',
  loginGoogleUnavailable: 'Login com Google não configurado',
  loginGoogleUnavailableHint: 'Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env do servidor (veja .env.example) e reinicie.',
  loginGoogleError: 'Não foi possível abrir o login com Google. Tente de novo.',
  loginLegal: { before: 'No primeiro acesso, você aceita os', terms: 'Termos de uso', and: 'e o', privacy: 'Aviso de privacidade', after: '.' },
  signInFailedTitle: 'Não foi possível entrar',
  signInFailed: 'O login com Google não foi concluído. Tente de novo.',
  signInFailedClose: 'Fechar',
  loginCancel: 'Agora não',
  loginSimulateHint: 'Desenvolvimento: entre com a conta de demonstração.',
  loginConfirm: 'Simular entrada como leitor',
  reasons: {
    vote: 'votar no nível do atleta',
    comment: 'comentar',
    reply: 'responder',
    react: 'curtir ou descurtir comentários',
    account: 'ver sua conta',
    default: 'continuar',
  },
  consent: {
    kicker: 'Conta',
    title: 'Antes de continuar',
    text: (email: string) => `Você entrou com ${email}. Para votar e comentar, confirme os dois itens abaixo.`,
    acceptHint: 'Marque as duas caixas para continuar.',
    documentsBefore: 'Li e aceito os',
    terms: (version: string) => `Termos de uso (v${version})`,
    and: 'e o',
    privacy: (version: string) => `Aviso de privacidade (v${version})`,
    adult: (age: number) => `Declaro ter ${age} anos ou mais.`,
    decline: 'Não aceito, sair',
    accept: 'Continuar',
    error: 'Não foi possível registrar o aceite. Tente de novo.',
  },
} as const;
export const SESSION_MESSAGES = defineMessages(SESSION_TEXT, { en: SESSION_TEXT_EN, es: SESSION_TEXT_ES });
