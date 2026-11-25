import {
  type AdminAuditAction,
  type BannedWordMatchMode,
  type CommentStatus,
  type ContactStatus,
  type DossierStatus,
  defineMessages,
  type GreatsEvidenceType,
  type IngestionGate,
  type IngestionRunStatus,
  type PrivacyDeadline,
  type PrivacyRequestStatus,
  type PrivacyRight,
  type PrivacySubjectKind,
  type ReviewStatus,
  type SourceUsageStatus,
  type SuggestionStatus,
  type UserRole,
} from '@was/shared';

import type { TagTone } from '@/shared-ui/tag.component';

import { ADMIN_LABELS_TEXT_EN } from './admin-labels.const.en';
import { ADMIN_LABELS_TEXT_ES } from './admin-labels.const.es';

// pt-BR labels of admin values (en/es next to it). Tones are data and live in ADMIN_STATUS_TONES.
export const ADMIN_LABELS_TEXT: {
  reviewStatus: Record<ReviewStatus, string>;
  dossierStatus: Record<DossierStatus, string>;
  runStatus: Record<IngestionRunStatus, string>;
  privacyStatus: Record<PrivacyRequestStatus, string>;
  deadline: Record<PrivacyDeadline, string>;
  suggestionStatus: Record<SuggestionStatus, string>;
  contactStatus: Record<ContactStatus, string>;
  commentStatus: Record<CommentStatus, string>;
  userRole: Record<UserRole, string>;
  gate: Record<IngestionGate, string>;
  privacyRight: Record<PrivacyRight, string>;
  privacySubject: Record<PrivacySubjectKind, string>;
  evidenceType: Record<GreatsEvidenceType, string>;
  auditAction: Record<AdminAuditAction, string>;
  matchMode: Record<BannedWordMatchMode, string>;
  /** Locales of the banned-words list (doc 20). Unknown locales fall back to the code. */
  locale: Record<string, string>;
} = {
  reviewStatus: {
    pending: 'Pendente',
    approved: 'Aprovada',
    rejected: 'Rejeitada',
    skipped: 'Pulada',
  },
  dossierStatus: {
    draft: 'Rascunho',
    pending: 'Aguardando aprovação',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
  },
  runStatus: {
    running: 'Rodando',
    success: 'Sucesso',
    partial: 'Parcial',
    failed: 'Falhou',
  },
  privacyStatus: {
    open: 'Aberto',
    in_progress: 'Em andamento',
    answered: 'Respondido',
    rejected: 'Recusado',
  },
  deadline: {
    overdue: 'Atrasado',
    due_soon: 'Vence em breve',
    on_track: 'No prazo',
    closed: 'Encerrado',
  },
  suggestionStatus: {
    pending: 'Pendente',
    approved: 'Aprovada',
    rejected: 'Rejeitada',
    duplicate: 'Duplicada',
  },
  contactStatus: {
    new: 'Nova',
    answered: 'Respondida',
    closed: 'Encerrada',
  },
  commentStatus: {
    visible: 'Visível',
    hidden: 'Oculto',
  },
  userRole: {
    reader: 'Leitor',
    admin: 'Admin',
  },
  gate: {
    unchanged: 'Sem mudança',
    noise: 'Ruído',
    parser: 'Parser',
    duplicate: 'Duplicado',
    budget: 'Orçamento',
  },
  privacyRight: {
    access: 'Acesso',
    correction: 'Correção',
    deletion: 'Eliminação',
    portability: 'Portabilidade',
    opposition: 'Oposição',
    revoke: 'Revogar consentimento',
  },
  privacySubject: {
    user: 'Usuário',
    athlete: 'Atleta',
    heir: 'Herdeiro',
    other: 'Outro',
  },
  evidenceType: {
    technique_named: 'Técnica com o nome dele',
    decades_record: 'Recorde de décadas',
    rule_or_market_change: 'Mudou regra ou mercado',
    global_popularization: 'Popularização global',
    institutional_recognition: 'Reconhecimento institucional',
    other: 'Outra',
  },
  auditAction: {
    role_changed: 'Papel alterado',
    user_banned: 'Conta banida',
    user_unbanned: 'Banimento revogado',
    tier_changed: 'Tier oficial alterado',
    proposal_approved: 'Proposta aprovada',
    proposal_rejected: 'Proposta rejeitada',
    dossier_approved: 'Dossiê aprovado',
    dossier_rejected: 'Dossiê rejeitado',
    source_updated: 'Fonte atualizada',
    links_queued: 'Links enviados à coleta',
    suggestion_reviewed: 'Sugestão avaliada',
    message_updated: 'Mensagem atualizada',
    privacy_updated: 'Pedido de privacidade atualizado',
    comment_moderated: 'Comentário moderado',
    banned_word_added: 'Palavra proibida adicionada',
    banned_word_removed: 'Palavra proibida removida',
    ingestion_triggered: 'Coleta disparada',
    identity_decided: 'Identidade decidida',
    ranking_calculated: 'Ranking calculado',
    ranking_approved: 'Ranking aprovado',
    ranking_published: 'Ranking publicado',
    ranking_auto_published: 'Ranking publicado automaticamente',
    ranking_reverted: 'Ranking revertido',
    ranking_auto_publish_skipped: 'Publicação automática ignorada',
    entity_merged: 'Entidades mescladas',
    entity_unmerged: 'Mescla desfeita',
    tier_vote_flag_reviewed: 'Conta sinalizada revisada (votos de tier)',
  },
  matchMode: {
    word: 'Palavra inteira',
    contains: 'Também dentro de palavras',
  },
  locale: {
    'pt-BR': 'Português',
    en: 'Inglês',
    es: 'Espanhol',
  },
};

export const ADMIN_LABELS_MESSAGES = defineMessages(ADMIN_LABELS_TEXT, { en: ADMIN_LABELS_TEXT_EN, es: ADMIN_LABELS_TEXT_ES });

/** Tag tone of each status value (not translated). */
export const ADMIN_STATUS_TONES = {
  reviewStatus: { pending: 'gold', approved: 'success', rejected: 'danger', skipped: 'default' } satisfies Record<ReviewStatus, TagTone>,
  dossierStatus: { draft: 'default', pending: 'gold', approved: 'success', rejected: 'danger' } satisfies Record<DossierStatus, TagTone>,
  runStatus: { running: 'info', success: 'success', partial: 'gold', failed: 'danger' } satisfies Record<IngestionRunStatus, TagTone>,
  privacyStatus: { open: 'gold', in_progress: 'info', answered: 'success', rejected: 'danger' } satisfies Record<PrivacyRequestStatus, TagTone>,
  deadline: { overdue: 'danger', due_soon: 'gold', on_track: 'success', closed: 'default' } satisfies Record<PrivacyDeadline, TagTone>,
  suggestionStatus: { pending: 'gold', approved: 'success', rejected: 'danger', duplicate: 'default' } satisfies Record<SuggestionStatus, TagTone>,
  contactStatus: { new: 'gold', answered: 'success', closed: 'default' } satisfies Record<ContactStatus, TagTone>,
  commentStatus: { visible: 'success', hidden: 'danger' } satisfies Record<CommentStatus, TagTone>,
  sourceUsage: { active: 'success', pending_permission: 'gold', link_only: 'info', rejected: 'danger' } satisfies Record<SourceUsageStatus, TagTone>,
  userRole: { reader: 'default', admin: 'gold' } satisfies Record<UserRole, TagTone>,
};
