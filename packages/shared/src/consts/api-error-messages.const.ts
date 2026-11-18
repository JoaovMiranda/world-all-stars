import { defineMessages } from '../i18n/messages.helper';
import { API_ERROR_TEXT_EN } from './api-error-messages.const.en';
import { API_ERROR_TEXT_ES } from './api-error-messages.const.es';

// pt-BR messages of API errors (server responses and web fixtures say the same thing); en/es next to it.
export const API_ERROR_TEXT = {
  checkFields: 'Confira os campos destacados.',
  signIn: 'Entre para continuar.',
  forbidden: 'Você não tem permissão para esta ação.',
  banned: 'Sua conta está suspensa.',
  notFound: 'Não encontrado.',
  ownComment: 'Você não pode reagir ao próprio comentário.',
  parentGone: 'O comentário respondido não existe mais.',
  mythicNeedsDossier: 'Mítico exige um dossiê "Mudou o jogo" aprovado.',
  sameTier: 'O atleta já está nesse tier.',
  proposalDecided: 'Esta proposta já foi decidida.',
  dossierDecided: 'Este dossiê já foi decidido.',
  dossierAlreadyApproved: 'Você já aprovou este dossiê: falta a aprovação de outro admin.',
  ownAccount: 'Você não pode alterar a própria conta.',
  bannedWordExists: 'Esta palavra já está na lista.',
  bannedWordExistsField: 'Esta palavra já está na lista deste idioma.',
  invalidLinks: 'Há links inválidos.',
  rateLimited: 'Muitas tentativas. Espere um pouco e tente de novo.',
  internal: 'Algo deu errado do nosso lado. Tente de novo.',
  invalidJson: 'JSON inválido.',
  emailUnverified: 'Seu e-mail ainda não foi verificado pelo provedor de login. Verifique-o e entre de novo.',
  consentOutdated: 'Os Termos ou o Aviso de privacidade mudaram. Recarregue a página e aceite as versões atuais.',
  consentNotPending: 'Não há aceite pendente para esta sessão.',
} as const;

export type ApiErrorMessageKey = keyof typeof API_ERROR_TEXT;
export const API_ERROR_MESSAGES = defineMessages(API_ERROR_TEXT, { en: API_ERROR_TEXT_EN, es: API_ERROR_TEXT_ES });
