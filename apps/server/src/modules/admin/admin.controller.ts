import { type AdminApi, adminPendingCounts } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { AdminCollectionService } from './admin-collection.service';
import { AdminCommunityService } from './admin-community.service';
import { AdminIdentityService } from './admin-identity.service';
import { AdminReviewService } from './admin-review.service';

/** A1–A8 of the admin panel. Access `admin` comes from the contracts (401 anonymous, 403 reader). */
export class AdminController extends BaseController {
  private get collection() {
    return this.service(AdminCollectionService);
  }

  private get community() {
    return this.service(AdminCommunityService);
  }

  private get identity() {
    return this.service(AdminIdentityService);
  }

  private get review() {
    return this.service(AdminReviewService);
  }

  /** Painel: the same queues as each section, counted by the shared rule (adminPendingCounts). */
  async summary() {
    const [proposals, signals, ingestion, sources, comments, inbox, dossiers, privacy] = await Promise.all([
      this.review.listProposals(),
      this.review.listTierSignals(),
      this.collection.listIngestion(),
      this.collection.listAdminSources(),
      this.community.listAdminComments(),
      this.community.listInbox(),
      this.review.listDossiers(),
      this.community.listPrivacy(),
    ]);
    return {
      pending: adminPendingCounts({
        proposals: proposals.items,
        signals: signals.items,
        runs: ingestion.runs,
        sources,
        comments: comments.items,
        inbox,
        dossiers: dossiers.items,
        privacy: privacy.items,
      }),
    };
  }

  // ── A1 · proposals and tier signals, A6 · dossiers ──
  proposals() {
    return this.review.listProposals();
  }

  reviewProposal({ params, body }: ContractInputOf<typeof AdminApi.reviewProposal>) {
    return this.review.reviewProposal(params.id, body.decision, body.reason);
  }

  tierSignals() {
    return this.review.listTierSignals();
  }

  dossiers() {
    return this.review.listDossiers();
  }

  reviewDossier({ params, body }: ContractInputOf<typeof AdminApi.reviewDossier>) {
    return this.review.reviewDossier(params.id, body.decision, body.reason);
  }

  // ── A2 · ingestion, A3 · sources and collection links ──
  ingestion() {
    return this.collection.listIngestion();
  }

  runIngestion({ body }: ContractInputOf<typeof AdminApi.runIngestion>) {
    return this.collection.runIngestion(body.jobKey, body.names);
  }

  sources() {
    return this.collection.listAdminSources();
  }

  updateSource({ params, body }: ContractInputOf<typeof AdminApi.updateSource>) {
    return this.collection.updateSource(params.id, body);
  }

  addCollectionLinks({ body }: ContractInputOf<typeof AdminApi.addCollectionLinks>) {
    return this.collection.addCollectionLinks(body);
  }

  // ── Identity review queue ──
  identities() {
    return this.identity.listIdentities();
  }

  decideIdentity({ params, body }: ContractInputOf<typeof AdminApi.decideIdentity>) {
    return this.identity.decideIdentity(params.id, body);
  }

  // ── A4 · users, A5 · privacy, A7 · comments and banned words, A8 · inbox ──
  users() {
    return this.community.listUsers();
  }

  updateUser({ params, body }: ContractInputOf<typeof AdminApi.updateUser>) {
    return this.community.updateUser(params.id, body);
  }

  privacyRequests() {
    return this.community.listPrivacy();
  }

  updatePrivacyRequest({ params, body }: ContractInputOf<typeof AdminApi.updatePrivacyRequest>) {
    return this.community.updatePrivacy(params.id, body.status, body.note);
  }

  comments() {
    return this.community.listAdminComments();
  }

  moderateComment({ params, body }: ContractInputOf<typeof AdminApi.moderateComment>) {
    return this.community.moderateComment(params.id, body.status, body.reason);
  }

  addBannedWord({ body }: ContractInputOf<typeof AdminApi.addBannedWord>) {
    return this.community.addBannedWord(body);
  }

  removeBannedWord({ params }: ContractInputOf<typeof AdminApi.removeBannedWord>) {
    return this.community.removeBannedWord(params);
  }

  inbox() {
    return this.community.listInbox();
  }

  reviewSuggestion({ params, body }: ContractInputOf<typeof AdminApi.reviewSuggestion>) {
    return this.community.reviewSuggestion(params.id, body.status, body.note);
  }

  updateContactMessage({ params, body }: ContractInputOf<typeof AdminApi.updateContactMessage>) {
    return this.community.updateContactMessage(params.id, body.status);
  }
}
