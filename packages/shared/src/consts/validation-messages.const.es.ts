import type { Messages } from '../i18n/messages.helper';
import type { VALIDATION_TEXT } from './validation-messages.const';

export const VALIDATION_TEXT_ES = {
  required: 'Campo obligatorio.',
  commentEmpty: 'Escribe algo antes de publicar. Solo espacios o líneas en blanco no cuentan.',
  tooLong: (max, length) => `El límite es de ${max} caracteres (tu texto tiene ${length}).`,
  bannedWord: 'El texto tiene una palabra que no está permitida aquí. Reescríbelo e inténtalo de nuevo.',
  athleteNameRequired: 'Indica el nombre del atleta.',
  athleteNameTooLong: (max) => `Nombre demasiado largo (máximo ${max} caracteres).`,
  athleteExists: (knownAs) => `${knownAs} ya está en el sitio.`,
  urlsRequired: 'Incluye al menos un enlace de fuente (por ejemplo, la página del atleta en Wikipedia).',
  urlsTooMany: (max) => `Usa como máximo ${max} enlaces.`,
  urlsDuplicated: 'Hay enlaces repetidos.',
  urlInvalid: 'Eso no parece un enlace. Pega la dirección completa, empezando por https://',
  urlNotHttps: 'Usa un enlace seguro, que empiece por https://',
  urlForbiddenHost: 'Dirección no aceptada. Usa el enlace público de la página.',
  urlRejectedSource: (source) => `${source} no se acepta como fuente (origen de los datos no declarado).`,
  noteLinkOnly: (source) => `${source} entra solo como referencia: su contenido no se recopila.`,
  noteNoWiki: 'Sin enlace de Wikipedia o Wikidata, el equipo de curaduría revisa la fuente a mano (puede tardar más).',
  emailInvalid: 'Correo electrónico no válido.',
  contactNameRequired: 'Indica tu nombre.',
  contactEmailRequired: 'Indica un correo electrónico válido para la respuesta.',
  contactTopicRequired: 'Elige el asunto.',
  contactBodyEmpty: 'Escribe tu mensaje. Solo espacios no cuentan.',
  accountDeleteConfirmation: (word) => `Escribe ${word} para confirmar.`,
} satisfies Messages<typeof VALIDATION_TEXT>;
