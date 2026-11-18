import { ACCESS_LOG_RETENTION_MONTHS, ACCOUNT_MIN_AGE, CONTACT_RETENTION_MONTHS, type Messages } from '@was/shared';

import type { LEGAL_TEXT, LegalDocs } from './legal.const';

const PENDING = {
  controller: '[PENDIENTE: razón social, CNPJ y dirección de la persona jurídica]',
  privacyEmail: '[PENDIENTE: correo del canal de privacidad, p. ej.: privacidade@dominio]',
  forum: '[PENDIENTE: jurisdicción competente, a definir según la sede de la persona jurídica]',
};

export const LEGAL_TEXT_ES = {
  eyebrow: 'Legal',
  draftNotice:
    'Borrador técnico (versión 0.x) basado en el plan de privacidad del proyecto. Antes del lanzamiento, el texto será revisado por un abogado y se completarán los campos marcados como PENDIENTE. Esta versión en español es una traducción de cortesía: ante cualquier diferencia, prevalece la versión en portugués.',
  actions: {
    contactPrivacy: 'Hablar con el equipo de curaduría sobre privacidad',
    myData: 'Mis datos (exportar o eliminar la cuenta)',
    cookies: 'Política de cookies',
    privacy: 'Aviso de privacidad',
    terms: 'Términos de uso',
    contact: 'Informar de una barrera',
  },
} satisfies Messages<typeof LEGAL_TEXT>;

const eyebrow = LEGAL_TEXT_ES.eyebrow;

export const LEGAL_DOCS_ES: LegalDocs = {
  privacy: {
    title: 'Aviso de privacidad',
    eyebrow,
    lead: 'Qué datos personales trata World All Stars, para qué, con qué base legal, durante cuánto tiempo y cómo ejerces tus derechos (LGPD, Ley brasileña 13.709/2018).',
    sections: [
      {
        id: 'controlador',
        title: 'Quiénes somos',
        blocks: [
          { kind: 'p', text: 'World All Stars es una enciclopedia gratuita de los mayores campeones de todos los deportes. El responsable de los datos personales es:' },
          { kind: 'notice', tone: 'warning', text: PENDING.controller },
        ],
      },
      {
        id: 'canal',
        title: 'Canal del titular',
        blocks: [
          {
            kind: 'p',
            text: 'Para cualquier solicitud sobre tus datos (acceso, rectificación, eliminación, portabilidad, oposición o revocación del consentimiento), usa el asunto «Privacidad (LGPD)» en la página Contacto o escribe al canal de privacidad. Como agente de pequeño tamaño (Resolución CD/ANPD n.º 2/2022), podemos no tener un encargado formal, pero el canal está garantizado.',
          },
          { kind: 'notice', tone: 'warning', text: PENDING.privacyEmail },
        ],
      },
      {
        id: 'dados',
        title: 'Qué datos, para qué y con qué base legal',
        blocks: [
          {
            kind: 'table',
            caption: 'Mapa de datos personales: titular, datos, finalidad, base legal y conservación',
            headers: ['Titular', 'Datos', 'Finalidad', 'Base legal (art. 7)', 'Conservación'],
            rows: [
              ['Visitante', 'IP, fecha y hora, dirección visitada, navegador (registros de acceso)', 'Seguridad y obligación del Marco Civil', 'Obligación legal (II)', `${ACCESS_LOG_RETENTION_MONTHS} meses; después se borran`],
              ['Visitante', 'Cookies esenciales (tema, idioma, sesión, consentimiento)', 'Funcionamiento del sitio', 'Interés legítimo (IX)', 'De la sesión a 12 meses'],
              ['Visitante', 'Cookies de medición y publicitarias (si se activan)', 'Estadística y monetización', 'Consentimiento (I)', 'Según el proveedor; revocable'],
              ['Lector con cuenta', 'Nombre, correo y foto de perfil recibidos de Google; identificador de la cuenta de Google; sesiones (hash de la IP y navegador); idioma; aceptación de los Términos y la Privacidad y declaración de mayoría de edad', 'Crear y mantener la cuenta, notificaciones', 'Ejecución de contrato (V)', 'Hasta la eliminación de la cuenta; después, anonimización'],
              ['Lector con cuenta', 'Votos de nivel, comentarios y reacciones', 'Comunidad y moderación', 'Ejecución de contrato (V) e interés legítimo (IX)', 'Permanente, bajo seudónimo tras la eliminación'],
              ['Atletas', 'Nombre, nacimiento, nacionalidad, carrera, foto con licencia libre', 'Enciclopedia sobre figuras públicas', 'Interés legítimo (IX); datos hechos públicos (art. 7, §4)', 'Mientras sea relevante; rectificación y oposición a petición'],
              ['Quien usa Contacto', 'Atleta sugerido, enlaces, justificación, nombre y correo', 'Evaluar la sugerencia y responder el mensaje', 'Interés legítimo (IX)', `${CONTACT_RETENTION_MONTHS} meses tras la decisión o el cierre`],
            ],
          },
          {
            kind: 'p',
            text: 'Los atletas también son titulares: ellos o sus herederos pueden pedir rectificación, oposición o retirada a través de Contacto, con prioridad en el análisis.',
          },
        ],
      },
      {
        id: 'cookies',
        title: 'Cookies',
        blocks: [
          {
            kind: 'p',
            text: 'Por defecto solo usamos cookies necesarias. Las cookies de medición y publicitarias dependen de tu consentimiento, que puedes revocar en cualquier momento. Los detalles están en la Política de cookies.',
          },
        ],
      },
      {
        id: 'compartilhamento',
        title: 'Con quién compartimos (encargados)',
        blocks: [
          {
            kind: 'list',
            items: [
              'Google (inicio de sesión): autentica tu cuenta y nos envía solo nombre, correo y foto de perfil (alcances openid, email, profile). Nunca recibimos tu contraseña.',
              'Cloudflare: red de distribución y protección contra ataques.',
              'Fly.io: servidor de la aplicación.',
              'Neon: base de datos.',
              'Resend: envío de correos.',
              'Sentry: registro de errores.',
              'Google y Meta: solo si hay medición o anuncios, y solo con consentimiento.',
              'Wikimedia: imágenes de atletas cargadas por enlace, hasta que llegue el proxy de imágenes.',
            ],
          },
        ],
      },
      {
        id: 'transferencia',
        title: 'Transferencia internacional',
        blocks: [
          {
            kind: 'p',
            text: 'Algunos encargados tratan datos fuera de Brasil. Estas transferencias siguen el art. 33 de la LGPD, con cláusulas contractuales de protección.',
          },
        ],
      },
      {
        id: 'retencao',
        title: 'Cuánto tiempo guardamos los datos',
        blocks: [
          {
            kind: 'list',
            items: [
              `Registros de acceso (IP, fecha y hora): ${ACCESS_LOG_RETENTION_MONTHS} meses, cifrados y accesibles solo por orden judicial (Marco Civil, art. 15).`,
              'Cuenta: mientras exista. Al eliminarla, el nombre y el correo se borran, y los comentarios y votos quedan bajo un seudónimo («Usuario eliminado #1234»).',
              `Sugerencias y mensajes de Contacto: ${CONTACT_RETENTION_MONTHS} meses tras la decisión o el cierre.`,
            ],
          },
        ],
      },
      {
        id: 'direitos',
        title: 'Tus derechos',
        blocks: [
          {
            kind: 'p',
            text: 'Según el art. 18 de la LGPD, puedes pedir: confirmación de que tratamos tus datos, acceso, rectificación, anonimización o eliminación, portabilidad, información sobre la comunicación de datos, revocación del consentimiento y oposición. Quien tiene cuenta exporta sus datos y elimina la cuenta por sí mismo, en Mis datos. Respondemos las demás solicitudes en un plazo de 15 días.',
          },
        ],
      },
      {
        id: 'seguranca',
        title: 'Seguridad',
        blocks: [
          {
            kind: 'p',
            text: 'Cifrado en tránsito (HTTPS), inicio de sesión solo con Google (no guardamos contraseñas), IP de las sesiones guardada solo como hash, acceso restringido por rol, registros de auditoría y copias de seguridad cifradas.',
          },
        ],
      },
      {
        id: 'anuncios',
        title: 'Anuncios',
        blocks: [
          {
            kind: 'p',
            text: 'Hoy el sitio no muestra anuncios. Si empieza a hacerlo, proveedores externos, incluido Google, podrán usar cookies para mostrar anuncios basados en visitas anteriores, siempre después de tu consentimiento. Esta sección listará los socios y los enlaces de desactivación (Configuración de anuncios de Google, aboutads.info).',
          },
        ],
      },
      {
        id: 'menores',
        title: 'Niños y adolescentes',
        blocks: [{ kind: 'p', text: `El sitio no está dirigido a menores. Leer no requiere cuenta; las cuentas son solo para mayores de ${ACCOUNT_MIN_AGE} años.` }],
      },
      {
        id: 'alteracoes',
        title: 'Cambios en este aviso',
        blocks: [
          {
            kind: 'p',
            text: 'Cada versión tiene número y fecha de vigencia. Los cambios relevantes se anuncian con antelación en el sitio y, a quien tiene cuenta, por correo.',
          },
        ],
      },
    ],
  },
  terms: {
    title: 'Términos de uso',
    eyebrow,
    lead: 'Las reglas para leer, votar, comentar y sugerir atletas en World All Stars.',
    sections: [
      {
        id: 'servico',
        title: 'Aceptación y servicio',
        blocks: [
          {
            kind: 'p',
            text: 'World All Stars es una enciclopedia gratuita de los mayores campeones de deportes físicos, mentales y electrónicos. Al usar el sitio, aceptas estos Términos y el Aviso de privacidad. Leer no requiere cuenta.',
          },
        ],
      },
      {
        id: 'contas',
        title: 'Cuentas',
        blocks: [
          {
            kind: 'list',
            items: [
              `Solo para mayores de ${ACCOUNT_MIN_AGE} años (declaración en el registro).`,
              'Una cuenta por persona, creada con el inicio de sesión de Google; tú te encargas de la seguridad de tu cuenta de Google.',
              'Las cuentas que abusen de las reglas pueden ser suspendidas.',
              'Con cuenta, votas el nivel de los atletas y comentas. Nadie edita los datos del sitio.',
            ],
          },
        ],
      },
      {
        id: 'participacao',
        title: 'Votos, comentarios y sugerencias',
        blocks: [
          {
            kind: 'list',
            items: [
              'Los datos vienen de las fuentes recopiladas y del equipo de curaduría. Los votos son la opinión de la comunidad; el nivel oficial lo decide el equipo de curaduría.',
              'Los comentarios tienen hasta 500 caracteres. Está prohibido el contenido falso, difamatorio, discriminatorio, con datos personales sensibles, spam o que infrinja derechos de autor.',
              'Las sugerencias de atletas necesitan un enlace de fuente y pasan por el equipo de curaduría antes de cualquier recopilación.',
              'Al publicar, licencias tu texto bajo CC BY-SA 4.0, compatible con las fuentes Wikipedia y Liquipedia.',
            ],
          },
        ],
      },
      {
        id: 'licencas',
        title: 'Contenido de terceros y licencias',
        blocks: [
          {
            kind: 'p',
            text: 'Las imágenes y textos de terceros conservan sus propias licencias (consulta la página Fuentes). Las marcas pertenecen a sus respectivos dueños.',
          },
        ],
      },
      {
        id: 'precisao',
        title: 'Exactitud de los datos',
        blocks: [
          {
            kind: 'p',
            text: 'Buscamos la exactitud con una fuente en cada dato, pero no garantizamos que todo sea correcto. Para corregir algo, usa el asunto «Error en un dato» en Contacto, con el enlace de la fuente correcta: la corrección se hace en la fuente y llega por la recopilación.',
          },
        ],
      },
      {
        id: 'remocao',
        title: 'Notificación y retirada',
        blocks: [
          {
            kind: 'p',
            text: 'Atletas, herederos y titulares de derechos pueden pedir rectificación o retirada a través de Contacto. Cada solicitud se analiza en un plazo de 15 días.',
          },
        ],
      },
      {
        id: 'propriedade',
        title: 'Propiedad intelectual',
        blocks: [{ kind: 'p', text: 'La marca, el diseño y el código del sitio son de World All Stars, separados del contenido de terceros con licencia.' }],
      },
      {
        id: 'responsabilidade',
        title: 'Limitación de responsabilidad y enlaces externos',
        blocks: [
          {
            kind: 'p',
            text: 'El sitio remite a fuentes externas que no controlamos. No respondemos por su contenido ni por decisiones tomadas solo con base en los datos de aquí.',
          },
        ],
      },
      {
        id: 'alteracoes',
        title: 'Cambios en los Términos',
        blocks: [
          {
            kind: 'p',
            text: 'Cada versión tiene número y fecha. Quien tiene cuenta recibe un aviso y debe aceptar la nueva versión para seguir votando y comentando.',
          },
        ],
      },
      {
        id: 'lei',
        title: 'Ley aplicable y jurisdicción',
        blocks: [
          {
            kind: 'p',
            text: 'Se aplica la legislación brasileña. Cuando se aplique el Código de Defensa del Consumidor, la jurisdicción es la de tu domicilio.',
          },
          { kind: 'notice', tone: 'warning', text: PENDING.forum },
        ],
      },
      {
        id: 'contato',
        title: 'Contacto',
        blocks: [{ kind: 'notice', tone: 'warning', text: PENDING.controller }],
      },
    ],
  },
  cookies: {
    title: 'Política de cookies',
    eyebrow,
    lead: 'Qué cookies usa el sitio, durante cuánto tiempo y cómo eliges (guía de cookies de la ANPD).',
    sections: [
      {
        id: 'o-que-sao',
        title: 'Qué son las cookies',
        blocks: [
          {
            kind: 'p',
            text: 'Las cookies y el almacenamiento local son pequeños datos guardados en tu navegador. Algunos son necesarios para que el sitio funcione; otros solo entran si los aceptas.',
          },
        ],
      },
      {
        id: 'categorias',
        title: 'Categorías',
        blocks: [
          {
            kind: 'table',
            caption: 'Categorías de cookies: finalidad, base legal y si vienen activadas',
            headers: ['Categoría', 'Para qué', 'Base legal', 'Por defecto'],
            rows: [
              ['Necesarias', 'Tema claro/oscuro, idioma, sesión de quien tiene cuenta, registro de tu elección de cookies', 'Interés legítimo', 'Siempre activas'],
              ['Medición', 'Estadística de visitas. Preferimos la medición sin cookies (Plausible o Umami)', 'Consentimiento', 'Desactivadas'],
              ['Publicidad', 'Solo si el sitio empieza a mostrar anuncios', 'Consentimiento', 'Desactivadas'],
            ],
          },
        ],
      },
      {
        id: 'lista',
        title: 'Lista de cookies y proveedores',
        blocks: [
          {
            kind: 'table',
            caption: 'Cookies en uso: nombre, proveedor, finalidad y duración',
            headers: ['Nombre', 'Proveedor', 'Finalidad', 'Duración'],
            rows: [
              ['was-theme', 'World All Stars', 'Recordar el tema claro u oscuro elegido (preferencia estrictamente necesaria)', '12 meses'],
              ['was_locale', 'World All Stars', 'Recordar el idioma elegido: portugués, inglés o español (preferencia estrictamente necesaria)', '12 meses'],
              ['was.session_token', 'World All Stars', 'Mantener tu sesión iniciada después del inicio de sesión con Google (estrictamente necesaria; HttpOnly)', 'Hasta cerrar sesión o 30 días'],
              ['was.state', 'World All Stars', 'Proteger el regreso del inicio de sesión con Google contra falsificaciones (estrictamente necesaria)', 'Unos minutos, durante el inicio de sesión'],
              ['consentimiento', 'World All Stars', 'Guardar tus elecciones de cookies', '12 meses'],
              ['WMF-Uniq', 'Wikimedia (tercero)', 'Se define al cargar fotos enlazadas directamente', 'Según Wikimedia; desaparece con el proxy de imágenes'],
            ],
          },
        ],
      },
      {
        id: 'escolhas',
        title: 'Cómo elegir y revocar',
        blocks: [
          {
            kind: 'list',
            items: [
              'El banner tiene «Aceptar todas», «Rechazar las no esenciales» y «Personalizar», con el mismo destaque.',
              'Ninguna categoría opcional viene marcada y ningún script no esencial se ejecuta antes de tu elección.',
              'Puedes cambiar tu elección en cualquier momento en «Preferencias de cookies», en el pie de página. Quien tiene cuenta también puede revocarla en Mis datos.',
              'También puedes bloquear las cookies en la configuración del navegador.',
            ],
          },
          { kind: 'notice', tone: 'info', text: 'El banner y el centro de cookies aún se implementarán (P19b). Hoy el sitio solo usa almacenamiento necesario.' },
        ],
      },
    ],
  },
  accessibility: {
    title: 'Declaración de accesibilidad',
    eyebrow: 'Compromiso',
    lead: 'World All Stars sigue las WCAG 2.2 nivel AA. Mira cómo se prueba el sitio, qué falta todavía y cómo informar de una barrera.',
    sections: [
      {
        id: 'padrao',
        title: 'Estándar adoptado',
        blocks: [
          {
            kind: 'p',
            text: 'Seguimos las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2, nivel AA, con el eMAG como referencia brasileña, como exige la Ley Brasileña de Inclusión (Ley 13.146/2015, art. 63).',
          },
        ],
      },
      {
        id: 'auditoria',
        title: 'Última auditoría',
        blocks: [
          { kind: 'p', text: 'Auditoría con Lighthouse 12.6.1 (perfil móvil) en los temas claro y oscuro, el 3 y el 4 de noviembre de 2026, sobre el prototipo:' },
          {
            kind: 'table',
            caption: 'Resultados de Lighthouse por página (accesibilidad y SEO)',
            headers: ['Página', 'Accesibilidad', 'SEO'],
            rows: [
              ['Inicio', '100', '100'],
              ['Perfil del atleta (claro y oscuro)', '100', '100'],
              ['Deporte', '100', '100'],
              ['Hall of Greats', '100', '100'],
              ['Atletas', '100', '100'],
              ['Fuentes', '100', '100'],
            ],
          },
        ],
      },
      {
        id: 'recursos',
        title: 'Qué ofrece el sitio',
        blocks: [
          {
            kind: 'list',
            items: [
              'Navegación completa por teclado, con el foco siempre visible y nunca tapado por la cabecera.',
              'Atajo «Saltar al contenido» y un único título principal por página.',
              'Contraste mínimo de 4,5:1 en ambos temas; el color nunca es la única señal (nivel y categoría tienen texto).',
              'Pestañas, calendario y globo operables por teclado; el globo tiene una lista de países equivalente.',
              'Gráficos con una tabla equivalente de los mismos datos.',
              'Formularios con etiquetas visibles, errores en texto debajo de cada campo y foco en el primer error.',
              'Diseño sin desplazamiento horizontal hasta 320 px y texto ampliable hasta el 200%.',
              'Animaciones cortas, desactivadas cuando el sistema pide movimiento reducido.',
            ],
          },
        ],
      },
      {
        id: 'limitacoes',
        title: 'Limitaciones conocidas',
        blocks: [
          {
            kind: 'list',
            items: [
              'Las barras doradas de los gráficos tienen poco contraste en el tema claro: los mismos datos están en una tabla al lado.',
              'Las fotos vienen de enlaces externos (Wikimedia) y pueden tardar en cargar; el nombre del atleta siempre está en texto.',
              'La interfaz está en portugués, inglés y español; parte del contenido de los atletas todavía existe solo en portugués (el sitio lo avisa cuando ocurre).',
            ],
          },
        ],
      },
      {
        id: 'testes',
        title: 'Cómo probamos',
        blocks: [
          {
            kind: 'list',
            items: [
              'En cada cambio: Lighthouse y axe-core automáticos, con cero infracciones graves o críticas.',
              'En cada versión: navegación solo con teclado, lectores de pantalla NVDA y VoiceOver, zoom del 200% y 400%, alto contraste y móviles reales.',
            ],
          },
        ],
      },
      {
        id: 'relatar',
        title: 'Informar de una barrera',
        blocks: [
          {
            kind: 'p',
            text: '¿Encontraste algo que impide o dificulta el uso? Envía un mensaje por Contacto, con el asunto «Otro asunto», indicando la página y lo que ocurrió. Respondemos en un plazo de 5 días hábiles.',
          },
        ],
      },
    ],
  },
};
