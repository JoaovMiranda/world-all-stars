import { defineMessages } from '../i18n/messages.helper';
import { VALIDATION_TEXT_EN } from './validation-messages.const.en';
import { VALIDATION_TEXT_ES } from './validation-messages.const.es';

// pt-BR messages of the shared validators (same text on the server 422 and in the form); en/es next to it.
// Never reveal WHICH banned word matched (doc 20).
export const VALIDATION_TEXT = {
  required: 'Campo obrigatório.',
  commentEmpty: 'Escreva algo antes de publicar. Só espaços ou linhas em branco não valem.',
  tooLong: (max: number, length: number) => `O limite é de ${max} caracteres (o seu texto tem ${length}).`,
  bannedWord: 'O texto tem uma palavra que não é permitida aqui. Reescreva e tente de novo.',
  athleteNameRequired: 'Informe o nome do atleta.',
  athleteNameTooLong: (max: number) => `Nome muito longo (máximo de ${max} caracteres).`,
  athleteExists: (knownAs: string) => `${knownAs} já está no site.`,
  urlsRequired: 'Inclua pelo menos um link de fonte (por exemplo, a página do atleta na Wikipedia).',
  urlsTooMany: (max: number) => `Use no máximo ${max} links.`,
  urlsDuplicated: 'Há links repetidos.',
  urlInvalid: 'Isso não parece um link. Cole o endereço completo, começando com https://',
  urlNotHttps: 'Use um link seguro, começando com https://',
  urlForbiddenHost: 'Endereço não aceito. Use o link público da página.',
  urlRejectedSource: (source: string) => `${source} não é aceito como fonte (origem dos dados não declarada).`,
  noteLinkOnly: (source: string) => `${source} entra só como referência: o conteúdo de lá não é coletado.`,
  noteNoWiki: 'Sem link da Wikipedia ou do Wikidata, a curadoria confere a fonte manualmente (pode demorar mais).',
  emailInvalid: 'E-mail inválido.',
  contactNameRequired: 'Informe seu nome.',
  contactEmailRequired: 'Informe um e-mail válido para a resposta.',
  contactTopicRequired: 'Escolha o assunto.',
  contactBodyEmpty: 'Escreva sua mensagem. Só espaços não valem.',
  /** Generic messages of the Zod schemas (zodErrorMap): used when a schema has no message of its own. */
  schema: {
    invalid: 'Valor inválido.',
    tooShort: (min: number) => `Use pelo menos ${min} caracteres.`,
    tooLong: (max: number) => `Use no máximo ${max} caracteres.`,
    tooFew: (min: number) => `Escolha pelo menos ${min}.`,
    tooMany: (max: number) => `Escolha no máximo ${max}.`,
    tooSmall: (min: number) => `O mínimo é ${min}.`,
    tooBig: (max: number) => `O máximo é ${max}.`,
    choose: 'Escolha uma das opções.',
    mustAccept: 'Marque esta opção para continuar.',
    date: 'Data inválida.',
    unknownFields: (fields: string) => `Campos não reconhecidos: ${fields}.`,
  },
  /** Word typed to confirm the account deletion, per language (the server accepts the request language's word). */
  accountDeleteWord: 'EXCLUIR',
  accountDeleteConfirmation: (word: string) => `Digite ${word} para confirmar.`,
} as const;

export const VALIDATION_MESSAGES = defineMessages(VALIDATION_TEXT, { en: VALIDATION_TEXT_EN, es: VALIDATION_TEXT_ES });
