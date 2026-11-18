import { defineMessages, type IngestionRunStatus, type SourceOriginKind, type SourceUsageStatus } from '@was/shared';

import type { TagTone } from '@/shared-ui/tag.component';

import { SOURCES_TEXT_EN } from './sources.const.en';
import { SOURCES_TEXT_ES } from './sources.const.es';

// UI strings of the sources module (pt-BR source; en/es next to it).
export const SOURCES_TEXT = {
  page: {
    title: 'Fontes',
    heading: 'De onde vêm os dados',
    eyebrow: 'Transparência',
    lead: 'Cada dado do site aponta para uma fonte, com licença e data de coleta. Aqui estão todas as fontes: as que usamos, as que aguardam permissão e as que só recebem link.',
  },
  kpis: {
    label: 'Fontes por situação',
    active: 'Fontes em uso',
    pending_permission: 'Aguardando permissão',
    link_only: 'Só link',
    rejected: 'Descartadas',
  } satisfies Record<SourceUsageStatus | 'label', string>,
  list: {
    title: 'Fontes',
    filterLabel: 'Filtrar por situação',
    chip: (label: string, n: number) => `${label} · ${n}`,
    athletes: 'atletas',
    fields: 'campos',
    achievements: 'conquistas',
    noRun: 'sem coleta automática',
    lastRun: (checked: number, unchanged: number, updated: number, errors: number, mode: string) =>
      `Última execução: ${checked} verificados · ${unchanged} sem mudança · ${updated} atualizados · ${errors} erros (modo ${mode}).`,
    linksCaption: (name: string) => `Links coletados de ${name}`,
    colLink: 'Link coletado',
    colEntity: 'Entidade',
    colRevision: 'Revisão',
    colChecked: 'Verificado',
    noLinks: 'Nenhum link coletado desta fonte.',
    openSource: (name: string) => `Abrir ${name}`,
    external: '(abre em nova aba)',
    emptyTitle: 'Nenhuma fonte cadastrada ainda',
    emptyText: 'O registro de fontes (licença, uso comercial e situação) aparece aqui antes da primeira coleta.',
    noMatch: 'Nenhuma fonte nesta situação.',
    dash: '—',
  },
  runs: {
    title: 'Coleta assistida por IA',
    eyebrow: 'extrator local · docs 11 e 18',
    intro:
      'A IA só propõe: cada fato vira uma proposta que o admin aprova. Antes de gastar qualquer token, cada execução passa por portões. Se a revisão da fonte não mudou, o extrator nem é chamado (0 tokens). Cada fato proposto só entra se o trecho citado existir literalmente na fonte.',
    gatesTitle: 'Os portões, do mais barato ao mais caro',
    gates: [
      { title: 'Agenda e revisão', text: 'A fonte está no período de checagem e mudou de revisão (revid, ETag)? Sem mudança, nem baixa o conteúdo.' },
      { title: 'Seção e ruído', text: 'Só a seção relevante, comparada pelo hash. Mudança só de formatação, link ou ortografia é descartada.' },
      { title: 'Parser primeiro', text: 'Tabela bem formada vai para o parser determinístico, sem IA. Trecho já processado reaproveita o resultado.' },
      { title: 'Diff mínimo e orçamento', text: 'O modelo recebe só as linhas alteradas, dentro de um limite por execução. O que sobra fica para a próxima.' },
      { title: 'Trecho literal', text: 'Cada valor traz o trecho da fonte (evidence_quote). Se o trecho não existe no texto original, o fato é descartado.' },
      { title: 'Aprovação', text: 'Nada vai ao ar direto: vira proposta na fila da curadoria, com o trecho da fonte ao lado de cada valor.' },
    ],
    caption: 'Execuções da coleta assistida por IA',
    colStarted: 'Execução',
    colMode: 'Modo',
    colChecked: 'Verificados',
    colUnchanged: 'Sem mudança (0 tokens)',
    colValidated: 'Validados',
    colAccepted: 'Fatos aceitos',
    colRejected: 'Descartados',
    colTokens: 'Tokens do extrator',
    empty: 'Nenhuma execução registrada ainda.',
  },
  origins: {
    title: 'As 6 origens primárias do mercado',
    eyebrow: 'de onde vem qualquer dado esportivo',
    items: [
      { title: '1. Súmulas oficiais', text: 'Federações, árbitros e comissões (FIFA, FIDE, CBDA).' },
      { title: '2. A própria plataforma', text: 'Partidas geradas no Lichess, Chess.com, servidores de CS.' },
      { title: '3. Coleta humana', text: 'Scouts assistindo às partidas (Opta, BoxRec, HLTV).' },
      { title: '4. Arquivo histórico', text: 'Jornais e anuários pesquisados por voluntários (RSSSF, Olympedia).' },
      { title: '5. Comunidade', text: 'Wikipedia, Liquipedia, TheSportsDB copiando de 1 a 4.' },
      { title: '6. Revenda', text: 'Feeds comerciais licenciados (Opta, Sportradar, GRID).' },
    ],
  },
  /** `commercialUse` of the registry (free text in the contract). Unknown values fall back to the raw key. */
  commercialUse: {
    yes: 'Uso comercial ok',
    no: 'Uso comercial não',
    ask: 'Pedir confirmação',
    'paid-for-lpdb': 'Comercial pago (LPDB)',
  } as Record<string, string>,
  originKind: {
    community: 'Comunidade',
    official: 'Oficial',
    historians: 'Historiadores',
    proprietary: 'Proprietária',
    unknown: 'Não declarada',
  } satisfies Record<SourceOriginKind, string>,
  runStatus: {
    success: 'OK',
    partial: 'Parcial',
    failed: 'Falhou',
    running: 'Em andamento',
  } satisfies Record<IngestionRunStatus, string>,
} as const;

export const USAGE_STATUS_TONE: Record<SourceUsageStatus, TagTone> = { active: 'success', pending_permission: 'gold', link_only: 'info', rejected: 'danger' };
/** Tone of each `commercialUse` value of the registry (labels in SOURCES_TEXT.commercialUse). */
export const COMMERCIAL_USE_TONE: Record<string, TagTone> = { yes: 'success', no: 'danger', ask: 'gold', 'paid-for-lpdb': 'gold' };
export const RUN_STATUS_TONE: Record<IngestionRunStatus, TagTone> = { success: 'success', partial: 'gold', failed: 'danger', running: 'info' };

export const SOURCES_MESSAGES = defineMessages(SOURCES_TEXT, { en: SOURCES_TEXT_EN, es: SOURCES_TEXT_ES });
