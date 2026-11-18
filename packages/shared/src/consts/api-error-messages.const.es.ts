import type { Messages } from '../i18n/messages.helper';
import type { API_ERROR_TEXT } from './api-error-messages.const';

export const API_ERROR_TEXT_ES = {
  checkFields: 'Revisa los campos destacados.',
  signIn: 'Inicia sesión para continuar.',
  forbidden: 'No tienes permiso para esta acción.',
  banned: 'Tu cuenta está suspendida.',
  notFound: 'No encontrado.',
  ownComment: 'No puedes reaccionar a tu propio comentario.',
  parentGone: 'El comentario al que respondiste ya no existe.',
  mythicNeedsDossier: 'Mítico exige un dossier «Cambió el juego» aprobado.',
  sameTier: 'El atleta ya está en ese nivel.',
  proposalDecided: 'Esta propuesta ya fue decidida.',
  dossierDecided: 'Este dossier ya fue decidido.',
  dossierAlreadyApproved: 'Ya aprobaste este dossier: falta la aprobación de otro admin.',
  ownAccount: 'No puedes modificar tu propia cuenta.',
  bannedWordExists: 'Esta palabra ya está en la lista.',
  bannedWordExistsField: 'Esta palabra ya está en la lista de este idioma.',
  invalidLinks: 'Hay enlaces no válidos.',
  rateLimited: 'Demasiados intentos. Espera un poco y vuelve a intentarlo.',
  internal: 'Algo salió mal de nuestro lado. Inténtalo de nuevo.',
  invalidJson: 'JSON no válido.',
  emailUnverified: 'Tu correo aún no fue verificado por el proveedor de inicio de sesión. Verifícalo y vuelve a entrar.',
  consentOutdated: 'Los Términos o el Aviso de privacidad cambiaron. Recarga la página y acepta las versiones actuales.',
  consentNotPending: 'No hay ninguna aceptación pendiente para esta sesión.',
} satisfies Messages<typeof API_ERROR_TEXT>;
