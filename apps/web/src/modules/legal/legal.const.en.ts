import { ACCESS_LOG_RETENTION_MONTHS, ACCOUNT_MIN_AGE, CONTACT_RETENTION_MONTHS, type Messages } from '@was/shared';

import type { LEGAL_TEXT, LegalDocs } from './legal.const';

const PENDING = {
  controller: '[PENDING: legal name, CNPJ and address of the company]',
  privacyEmail: '[PENDING: email of the privacy channel, e.g. privacidade@domain]',
  forum: '[PENDING: court district, to be set with the company’s registered office]',
};

export const LEGAL_TEXT_EN = {
  eyebrow: 'Legal',
  draftNotice:
    'Technical draft (version 0.x) based on the project’s privacy plan. Before launch, the text will be reviewed by a lawyer and the fields marked PENDING will be filled in. This English version is a convenience translation: in case of any difference, the Portuguese version prevails.',
  actions: {
    contactPrivacy: 'Talk to the curators about privacy',
    myData: 'My data (export or delete account)',
    cookies: 'Cookie policy',
    privacy: 'Privacy notice',
    terms: 'Terms of use',
    contact: 'Report a barrier',
  },
} satisfies Messages<typeof LEGAL_TEXT>;

const eyebrow = LEGAL_TEXT_EN.eyebrow;

export const LEGAL_DOCS_EN: LegalDocs = {
  privacy: {
    title: 'Privacy notice',
    eyebrow,
    lead: 'Which personal data World All Stars processes, why, on what legal basis, for how long and how you exercise your rights (LGPD, Brazilian Law 13,709/2018).',
    sections: [
      {
        id: 'controlador',
        title: 'Who we are',
        blocks: [
          { kind: 'p', text: 'World All Stars is a free encyclopedia of the greatest champions in every sport. The controller of personal data is:' },
          { kind: 'notice', tone: 'warning', text: PENDING.controller },
        ],
      },
      {
        id: 'canal',
        title: 'Data subject channel',
        blocks: [
          {
            kind: 'p',
            text: 'For any request about your data (access, correction, deletion, portability, objection or withdrawal of consent), use the “Privacy (LGPD)” topic on the Contact page or write to the privacy channel. As a small-scale processing agent (ANPD Resolution CD/ANPD No. 2/2022), we may not have a formal data protection officer, but the channel is guaranteed.',
          },
          { kind: 'notice', tone: 'warning', text: PENDING.privacyEmail },
        ],
      },
      {
        id: 'dados',
        title: 'Which data, why and on what legal basis',
        blocks: [
          {
            kind: 'table',
            caption: 'Personal data map: data subject, data, purpose, legal basis and retention',
            headers: ['Data subject', 'Data', 'Purpose', 'Legal basis (art. 7)', 'Retention'],
            rows: [
              ['Visitor', 'IP, date and time, address visited, browser (access logs)', 'Security and Marco Civil obligation', 'Legal obligation (II)', `${ACCESS_LOG_RETENTION_MONTHS} months, then deleted`],
              ['Visitor', 'Essential cookies (theme, language, session, consent)', 'Running the site', 'Legitimate interest (IX)', 'From the session up to 12 months'],
              ['Visitor', 'Analytics and advertising cookies (if enabled)', 'Statistics and monetization', 'Consent (I)', 'As set by the provider; revocable'],
              ['Reader with an account', 'Name, e-mail and profile photo received from Google; Google account identifier; sessions (IP hash and browser); language; acceptance of the Terms and Privacy notice and the 18+ declaration', 'Creating and keeping the account, notifications', 'Performance of a contract (V)', 'Until the account is deleted, then anonymized'],
              ['Reader with an account', 'Tier votes, comments and reactions', 'Community and moderation', 'Performance of a contract (V) and legitimate interest (IX)', 'Permanent, under a pseudonym after deletion'],
              ['Athletes', 'Name, birth, nationality, career, freely licensed photo', 'Encyclopedia about public figures', 'Legitimate interest (IX); data made public (art. 7, §4)', 'While relevant; correction and objection on request'],
              ['People using Contact', 'Suggested athlete, links, reasoning, name and email', 'Assessing the suggestion and answering the message', 'Legitimate interest (IX)', `${CONTACT_RETENTION_MONTHS} months after the decision or closure`],
            ],
          },
          {
            kind: 'p',
            text: 'Athletes are data subjects too: they or their heirs can request correction, objection or removal through Contact, with priority review.',
          },
        ],
      },
      {
        id: 'cookies',
        title: 'Cookies',
        blocks: [
          {
            kind: 'p',
            text: 'By default we only use necessary cookies. Analytics and advertising cookies depend on your consent, which you can withdraw at any time. Details are in the Cookie policy.',
          },
        ],
      },
      {
        id: 'compartilhamento',
        title: 'Who we share with (processors)',
        blocks: [
          {
            kind: 'list',
            items: [
              'Google (sign-in): authenticates your account and sends us only your name, e-mail and profile photo (openid, email, profile scopes). We never receive your password.',
              'Cloudflare: delivery network and attack protection.',
              'Fly.io: application server.',
              'Neon: database.',
              'Resend: sending emails.',
              'Sentry: error tracking.',
              'Google and Meta: only if there is analytics or advertising, and only with consent.',
              'Wikimedia: athlete images loaded by link, until the image proxy is in place.',
            ],
          },
        ],
      },
      {
        id: 'transferencia',
        title: 'International transfer',
        blocks: [
          {
            kind: 'p',
            text: 'Some processors handle data outside Brazil. These transfers follow art. 33 of the LGPD, with protective contractual clauses.',
          },
        ],
      },
      {
        id: 'retencao',
        title: 'How long we keep data',
        blocks: [
          {
            kind: 'list',
            items: [
              `Access logs (IP, date and time): ${ACCESS_LOG_RETENTION_MONTHS} months, encrypted and accessible only by court order (Marco Civil, art. 15).`,
              'Account: for as long as it exists. On deletion, name and email are erased and comments and votes remain under a pseudonym (“Removed user #1234”).',
              `Contact suggestions and messages: ${CONTACT_RETENTION_MONTHS} months after the decision or closure.`,
            ],
          },
        ],
      },
      {
        id: 'direitos',
        title: 'Your rights',
        blocks: [
          {
            kind: 'p',
            text: 'Under art. 18 of the LGPD, you can request: confirmation that we process your data, access, correction, anonymization or deletion, portability, information about sharing, withdrawal of consent and objection. Account holders can export their data and delete their account themselves, in My data. We answer other requests within 15 days.',
          },
        ],
      },
      {
        id: 'seguranca',
        title: 'Security',
        blocks: [
          {
            kind: 'p',
            text: 'Encryption in transit (HTTPS), sign-in only through Google (we store no passwords), session IPs kept only as hashes, role-based access, audit logs and encrypted backups.',
          },
        ],
      },
      {
        id: 'anuncios',
        title: 'Advertising',
        blocks: [
          {
            kind: 'p',
            text: 'The site doesn’t show ads today. If it starts to, third-party vendors, including Google, may use cookies to serve ads based on previous visits, always after your consent. This section will list the partners and the opt-out links (Google Ads Settings, aboutads.info).',
          },
        ],
      },
      {
        id: 'menores',
        title: 'Children and teenagers',
        blocks: [{ kind: 'p', text: `The site is not aimed at minors. Reading requires no account; accounts are only for people aged ${ACCOUNT_MIN_AGE} or over.` }],
      },
      {
        id: 'alteracoes',
        title: 'Changes to this notice',
        blocks: [
          {
            kind: 'p',
            text: 'Every version has a number and an effective date. Relevant changes are announced in advance on the site and, for account holders, by email.',
          },
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of use',
    eyebrow,
    lead: 'The rules for reading, voting, commenting and suggesting athletes on World All Stars.',
    sections: [
      {
        id: 'servico',
        title: 'Acceptance and service',
        blocks: [
          {
            kind: 'p',
            text: 'World All Stars is a free encyclopedia of the greatest champions of physical, mind and electronic sports. By using the site, you agree to these Terms and to the Privacy notice. Reading requires no account.',
          },
        ],
      },
      {
        id: 'contas',
        title: 'Accounts',
        blocks: [
          {
            kind: 'list',
            items: [
              `Only for people aged ${ACCOUNT_MIN_AGE} or over (declared at sign-up).`,
              'One account per person, created with Google sign-in; you are responsible for keeping your Google account safe.',
              'Accounts that abuse the rules may be suspended.',
              'With an account, you vote on athletes’ tiers and comment. Nobody edits the site’s data.',
            ],
          },
        ],
      },
      {
        id: 'participacao',
        title: 'Votes, comments and suggestions',
        blocks: [
          {
            kind: 'list',
            items: [
              'Data comes from the collected sources and the curators. Votes are the community’s opinion; the official tier is decided by the curators.',
              'Comments are limited to 500 characters. False, defamatory or discriminatory content, sensitive personal data, spam and copyright infringement are forbidden.',
              'Athlete suggestions need a source link and go through the curators before any collection.',
              'By posting, you license your text under CC BY-SA 4.0, compatible with the Wikipedia and Liquipedia sources.',
            ],
          },
        ],
      },
      {
        id: 'licencas',
        title: 'Third-party content and licenses',
        blocks: [
          {
            kind: 'p',
            text: 'Third-party images and texts keep their own licenses (see the Sources page). Trademarks belong to their respective owners.',
          },
        ],
      },
      {
        id: 'precisao',
        title: 'Data accuracy',
        blocks: [
          {
            kind: 'p',
            text: 'We aim for accuracy with a source for every piece of data, but we don’t guarantee that everything is correct. To fix something, use the “Error in the data” topic on Contact, with the link to the correct source: the fix happens at the source and arrives through the collection.',
          },
        ],
      },
      {
        id: 'remocao',
        title: 'Notice and takedown',
        blocks: [
          {
            kind: 'p',
            text: 'Athletes, heirs and rights holders can request correction or removal through Contact. Each request is reviewed within 15 days.',
          },
        ],
      },
      {
        id: 'propriedade',
        title: 'Intellectual property',
        blocks: [{ kind: 'p', text: 'The site’s brand, design and code belong to World All Stars, separate from licensed third-party content.' }],
      },
      {
        id: 'responsabilidade',
        title: 'Limitation of liability and external links',
        blocks: [
          {
            kind: 'p',
            text: 'The site points to external sources we don’t control. We are not responsible for their content or for decisions based solely on the data here.',
          },
        ],
      },
      {
        id: 'alteracoes',
        title: 'Changes to the Terms',
        blocks: [
          {
            kind: 'p',
            text: 'Every version has a number and a date. Account holders are notified and must accept the new version to keep voting and commenting.',
          },
        ],
      },
      {
        id: 'lei',
        title: 'Governing law and jurisdiction',
        blocks: [
          {
            kind: 'p',
            text: 'Brazilian law applies. Where the Consumer Protection Code applies, the courts of your place of residence have jurisdiction.',
          },
          { kind: 'notice', tone: 'warning', text: PENDING.forum },
        ],
      },
      {
        id: 'contato',
        title: 'Contact',
        blocks: [{ kind: 'notice', tone: 'warning', text: PENDING.controller }],
      },
    ],
  },
  cookies: {
    title: 'Cookie policy',
    eyebrow,
    lead: 'Which cookies the site uses, for how long and how you choose (ANPD cookie guide).',
    sections: [
      {
        id: 'o-que-sao',
        title: 'What cookies are',
        blocks: [
          {
            kind: 'p',
            text: 'Cookies and local storage are small pieces of data kept in your browser. Some are necessary for the site to work; others only come in if you accept them.',
          },
        ],
      },
      {
        id: 'categorias',
        title: 'Categories',
        blocks: [
          {
            kind: 'table',
            caption: 'Cookie categories: purpose, legal basis and default',
            headers: ['Category', 'What for', 'Legal basis', 'Default'],
            rows: [
              ['Necessary', 'Light/dark theme, language, account session, record of your cookie choice', 'Legitimate interest', 'Always on'],
              ['Analytics', 'Visit statistics. We prefer cookieless analytics (Plausible or Umami)', 'Consent', 'Off'],
              ['Advertising', 'Only if the site starts showing ads', 'Consent', 'Off'],
            ],
          },
        ],
      },
      {
        id: 'lista',
        title: 'List of cookies and providers',
        blocks: [
          {
            kind: 'table',
            caption: 'Cookies in use: name, provider, purpose and duration',
            headers: ['Name', 'Provider', 'Purpose', 'Duration'],
            rows: [
              ['was-theme', 'World All Stars', 'Remember the light or dark theme you chose (strictly necessary preference)', '12 months'],
              ['was_locale', 'World All Stars', 'Remember the language you chose: Portuguese, English or Spanish (strictly necessary preference)', '12 months'],
              ['was.session_token', 'World All Stars', 'Keep you signed in after Google sign-in (strictly necessary; HttpOnly)', 'Until you sign out or 30 days'],
              ['was.state', 'World All Stars', 'Protect the return from Google sign-in against forgery (strictly necessary)', 'A few minutes, during sign-in'],
              ['consent', 'World All Stars', 'Store your cookie choices', '12 months'],
              ['WMF-Uniq', 'Wikimedia (third party)', 'Set when hotlinked photos load', 'As set by Wikimedia; goes away with the image proxy'],
            ],
          },
        ],
      },
      {
        id: 'escolhas',
        title: 'How to choose and withdraw',
        blocks: [
          {
            kind: 'list',
            items: [
              'The banner has “Accept all”, “Reject non-essential” and “Customize”, with equal prominence.',
              'No optional category comes pre-selected, and no non-essential script runs before your choice.',
              'You can change your choice at any time in “Cookie preferences”, in the footer. Account holders can also withdraw it in My data.',
              'You can also block cookies in your browser settings.',
            ],
          },
          { kind: 'notice', tone: 'info', text: 'The banner and the cookie center are still to be implemented (P19b). Today the site only uses necessary storage.' },
        ],
      },
    ],
  },
  accessibility: {
    title: 'Accessibility statement',
    eyebrow: 'Commitment',
    lead: 'World All Stars follows WCAG 2.2 level AA. See how the site is tested, what is still missing and how to report a barrier.',
    sections: [
      {
        id: 'padrao',
        title: 'Standard adopted',
        blocks: [
          {
            kind: 'p',
            text: 'We follow the Web Content Accessibility Guidelines (WCAG) 2.2, level AA, with eMAG as the Brazilian reference, as required by the Brazilian Inclusion Law (Law 13,146/2015, art. 63).',
          },
        ],
      },
      {
        id: 'auditoria',
        title: 'Latest audit',
        blocks: [
          { kind: 'p', text: 'Audit with Lighthouse 12.6.1 (mobile profile) in the light and dark themes, on 3 and 4 November 2026, on the prototype:' },
          {
            kind: 'table',
            caption: 'Lighthouse results per page (accessibility and SEO)',
            headers: ['Page', 'Accessibility', 'SEO'],
            rows: [
              ['Home', '100', '100'],
              ['Athlete profile (light and dark)', '100', '100'],
              ['Sport', '100', '100'],
              ['Hall of Greats', '100', '100'],
              ['Athletes', '100', '100'],
              ['Sources', '100', '100'],
            ],
          },
        ],
      },
      {
        id: 'recursos',
        title: 'What the site offers',
        blocks: [
          {
            kind: 'list',
            items: [
              'Full keyboard navigation, with focus always visible and never covered by the header.',
              '“Skip to content” shortcut and a single main heading per page.',
              'Minimum contrast of 4.5:1 in both themes; color is never the only cue (tier and level have text).',
              'Tabs, calendar and globe operable by keyboard; the globe has an equivalent list of countries.',
              'Charts with an equivalent table of the same data.',
              'Forms with visible labels, text errors below each field and focus on the first error.',
              'No horizontal scrolling down to 320 px and text that scales up to 200%.',
              'Short animations, turned off when the system asks for reduced motion.',
            ],
          },
        ],
      },
      {
        id: 'limitacoes',
        title: 'Known limitations',
        blocks: [
          {
            kind: 'list',
            items: [
              'The gold chart bars have low contrast in the light theme: the same data is in a table next to them.',
              'Photos come from external links (Wikimedia) and may load slowly; the athlete’s name is always in text.',
              'The interface is available in Portuguese, English and Spanish; part of the athlete content still exists only in Portuguese (the site says so when that happens).',
            ],
          },
        ],
      },
      {
        id: 'testes',
        title: 'How we test',
        blocks: [
          {
            kind: 'list',
            items: [
              'On every change: automated Lighthouse and axe-core, with zero serious or critical violations.',
              'On every release: keyboard-only navigation, NVDA and VoiceOver screen readers, 200% and 400% zoom, high contrast and real phones.',
            ],
          },
        ],
      },
      {
        id: 'relatar',
        title: 'Report a barrier',
        blocks: [
          {
            kind: 'p',
            text: 'Found something that prevents or hinders use? Send a message through Contact, with the topic “Something else”, telling us the page and what happened. We reply within 5 business days.',
          },
        ],
      },
    ],
  },
};
