import type {
  AdminAuditAction,
  BannedWordMatchMode,
  CommentStatus,
  ContactStatus,
  DossierStatus,
  GreatsEvidenceType,
  IngestionGate,
  IngestionRunStatus,
  PrivacyDeadline,
  PrivacyRequestStatus,
  PrivacyRight,
  PrivacySubjectKind,
  ReviewStatus,
  SourceUsageStatus,
  SuggestionStatus,
  UserRole,
} from '@was/shared';

import { SOURCE_USAGE_LABEL } from '@/shared-ui/domain-labels.const';
import type { TagTone } from '@/shared-ui/tag.component';

/** Label + tag tone of a status value (pt-BR, ready for i18n). */
export interface StatusMeta {
  label: string;
  tone: TagTone;
}

export const REVIEW_STATUS_META: Record<ReviewStatus, StatusMeta> = {
  pending: { label: 'Pendente', tone: 'gold' },
  approved: { label: 'Aprovada', tone: 'success' },
  rejected: { label: 'Rejeitada', tone: 'danger' },
  skipped: { label: 'Pulada', tone: 'default' },
};
export const DOSSIER_STATUS_META: Record<DossierStatus, StatusMeta> = {
  draft: { label: 'Rascunho', tone: 'default' },
  pending: { label: 'Aguardando aprovação', tone: 'gold' },
  approved: { label: 'Aprovado', tone: 'success' },
  rejected: { label: 'Rejeitado', tone: 'danger' },
};
export const RUN_STATUS_META: Record<IngestionRunStatus, StatusMeta> = {
  running: { label: 'Rodando', tone: 'info' },
  success: { label: 'Sucesso', tone: 'success' },
  partial: { label: 'Parcial', tone: 'gold' },
  failed: { label: 'Falhou', tone: 'danger' },
};
export const PRIVACY_STATUS_META: Record<PrivacyRequestStatus, StatusMeta> = {
  open: { label: 'Aberto', tone: 'gold' },
  in_progress: { label: 'Em andamento', tone: 'info' },
  answered: { label: 'Respondido', tone: 'success' },
  rejected: { label: 'Recusado', tone: 'danger' },
};
export const DEADLINE_META: Record<PrivacyDeadline, StatusMeta> = {
  overdue: { label: 'Atrasado', tone: 'danger' },
  due_soon: { label: 'Vence em breve', tone: 'gold' },
  on_track: { label: 'No prazo', tone: 'success' },
  closed: { label: 'Encerrado', tone: 'default' },
};
export const SUGGESTION_STATUS_META: Record<SuggestionStatus, StatusMeta> = {
  pending: { label: 'Pendente', tone: 'gold' },
  approved: { label: 'Aprovada', tone: 'success' },
  rejected: { label: 'Rejeitada', tone: 'danger' },
  duplicate: { label: 'Duplicada', tone: 'default' },
};
export const CONTACT_STATUS_META: Record<ContactStatus, StatusMeta> = {
  new: { label: 'Nova', tone: 'gold' },
  answered: { label: 'Respondida', tone: 'success' },
  closed: { label: 'Encerrada', tone: 'default' },
};
export const COMMENT_STATUS_META: Record<CommentStatus, StatusMeta> = {
  visible: { label: 'Visível', tone: 'success' },
  hidden: { label: 'Oculto', tone: 'danger' },
};
export const SOURCE_USAGE_META: Record<SourceUsageStatus, StatusMeta> = {
  active: { label: SOURCE_USAGE_LABEL.active, tone: 'success' },
  pending_permission: { label: SOURCE_USAGE_LABEL.pending_permission, tone: 'gold' },
  link_only: { label: SOURCE_USAGE_LABEL.link_only, tone: 'info' },
  rejected: { label: SOURCE_USAGE_LABEL.rejected, tone: 'danger' },
};
export const USER_ROLE_META: Record<UserRole, StatusMeta> = {
  reader: { label: 'Leitor', tone: 'default' },
  admin: { label: 'Admin', tone: 'gold' },
};
export const GATE_LABEL: Record<IngestionGate, string> = {
  unchanged: 'Sem mudança',
  noise: 'Ruído',
  parser: 'Parser',
  duplicate: 'Duplicado',
  budget: 'Orçamento',
};
export const PRIVACY_RIGHT_LABEL: Record<PrivacyRight, string> = {
  access: 'Acesso',
  correction: 'Correção',
  deletion: 'Eliminação',
  portability: 'Portabilidade',
  opposition: 'Oposição',
  revoke: 'Revogar consentimento',
};
export const PRIVACY_SUBJECT_LABEL: Record<PrivacySubjectKind, string> = {
  user: 'Usuário',
  athlete: 'Atleta',
  heir: 'Herdeiro',
  other: 'Outro',
};
export const EVIDENCE_TYPE_LABEL: Record<GreatsEvidenceType, string> = {
  technique_named: 'Técnica com o nome dele',
  decades_record: 'Recorde de décadas',
  rule_or_market_change: 'Mudou regra ou mercado',
  global_popularization: 'Popularização global',
  institutional_recognition: 'Reconhecimento institucional',
  other: 'Outra',
};
export const AUDIT_ACTION_LABEL: Record<AdminAuditAction, string> = {
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
};
export const MATCH_MODE_LABEL: Record<BannedWordMatchMode, string> = { word: 'Palavra inteira', contains: 'Também dentro de palavras' };
/** Locales of the banned-words list (doc 20). Unknown locales fall back to the code. */
export const LOCALE_LABEL: Record<string, string> = { 'pt-BR': 'Português', en: 'Inglês', es: 'Espanhol' };
