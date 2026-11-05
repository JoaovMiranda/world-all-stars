import { type AthleteProfile, COMMENT_SORT_VALUES, type CommentSort, type CommentsResponse } from '@was/shared';
import { useState } from 'react';

import { Button } from '@/shared-ui/button.component';
import { ChipToggleGroup } from '@/shared-ui/chip-toggle-group.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { Section } from '@/shared-ui/section.component';
import { useSession } from '@/session/use-session.hook';

import { ATHLETE_PROFILE_TEXT } from './athletes.const';
import { CommentForm } from './comment-form.component';
import { CommentItem } from './comment-item.component';

const T = ATHLETE_PROFILE_TEXT.comments;

interface CommentsTabProps {
  profile: AthleteProfile;
  comments: CommentsResponse;
  sort: CommentSort;
  onSort: (sort: CommentSort) => void;
}

/** Comentários (doc 20): threads with 1 level of replies, sort top/recent, reactions; visitors are invited to sign in. */
export function CommentsTab({ profile, comments, sort, onSort }: CommentsTabProps) {
  const { user, isSignedIn, requireLogin } = useSession();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const reply = (id: string) => {
    if (requireLogin('reply')) setReplyTo(id);
  };
  return (
    <Section
      title={T.title(profile.knownAs)}
      actions={
        <ChipToggleGroup
          label={T.sortLabel}
          required
          value={sort}
          onChange={(v) => v && onSort(v)}
          options={COMMENT_SORT_VALUES.map((v) => ({ value: v, label: T.sort[v] }))}
        />
      }
    >
      {isSignedIn && user ? (
        <CommentForm slug={profile.slug} label={T.formLabel(user.name)} />
      ) : (
        <div className="comment-login">
          <span className="muted">{T.loginText}</span>
          <Button variant="secondary" onClick={() => requireLogin('comment')}>
            {T.loginAction}
          </Button>
        </div>
      )}
      <p className="comment-rules">{T.rules(comments.max)}</p>
      {comments.threads.length ? (
        <div>
          {comments.threads.map((t) => (
            <div key={t.id} className="thread">
              <CommentItem comment={t} onReply={() => reply(t.id)} />
              {(t.replies.length > 0 || replyTo === t.id) && (
                <div className="replies" role="group" aria-label={T.repliesLabel(t.author)}>
                  {t.replies.map((r) => (
                    <CommentItem key={r.id} comment={r} />
                  ))}
                  {replyTo === t.id && isSignedIn && (
                    <CommentForm slug={profile.slug} parentId={t.id} label={T.replyLabel} autoFocus onDone={() => setReplyTo(null)} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState compact title={T.empty} mark="◇" />
      )}
    </Section>
  );
}
