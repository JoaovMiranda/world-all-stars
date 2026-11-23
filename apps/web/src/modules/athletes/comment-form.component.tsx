import { useQueryClient } from '@tanstack/react-query';
import { COMMENT_MAX_LENGTH, createCommentInputSchema } from '@was/shared';
import { useEffect, useMemo, useRef, useState } from 'react';

import { isApiError } from '@/data/api-error.error';
import { postComment } from '@/data/endpoints/comments.query';
import { validationContextQuery } from '@/data/endpoints/discovery.query';
import { sessionQuery } from '@/data/endpoints/session.query';
import { useLocale } from '@/i18n/locale.store';
import { useText } from '@/i18n/use-text.hook';
import { useSession } from '@/session/use-session.hook';
import { Button } from '@/shared-ui/button.component';
import { CharCounter } from '@/shared-ui/char-counter.component';
import { FormField } from '@/shared-ui/form-field.component';
import { Notice } from '@/shared-ui/notice.component';
import { Textarea } from '@/shared-ui/textarea.component';
import { useForm } from '@/shared-ui/use-form.hook';

import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';

interface CommentFormProps {
  slug: string;
  label: string;
  /** Reply to this comment (top-level when null). */
  parentId?: string | null;
  autoFocus?: boolean;
  onDone?: () => void;
}

/** Comment/reply form: shared validateComment rules (empty, invisible chars, 500 limit, banned words) + server 422. */
export function CommentForm({ slug, label, parentId = null, autoFocus = false, onDone }: CommentFormProps) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).comments;
  const locale = useLocale();
  const ctx = validationContextQuery.useQuery();
  const schema = useMemo(() => (ctx.data ? createCommentInputSchema(ctx.data.bannedWords, locale) : null), [ctx.data, locale]);
  const form = useForm({ schema, initialValues: { body: '', parentId } });
  // 'auth': the session expired while writing. The draft stays in the field (WCAG 2.2.5 / 3.3.7): sign in, resend.
  const [failed, setFailed] = useState<false | 'error' | 'auth'>(false);
  const { requireLogin } = useSession();
  const queryClient = useQueryClient();
  const [posted, setPosted] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const post = postComment.useMutation({
    onSuccess: () => {
      form.reset();
      setPosted(true);
      onDone?.();
    },
    onError: (e) => {
      if (isApiError(e) && e.status === 422) form.setServerErrors(e.body.errors ?? { body: e.body.message ?? T.error });
      else if (isApiError(e) && e.status === 401) {
        setFailed('auth');
        // The server no longer knows us: refresh the session so "Sign in again" opens the login dialog.
        void queryClient.invalidateQueries({ queryKey: sessionQuery.baseKey });
      } else setFailed('error');
    },
  });

  useEffect(() => {
    if (autoFocus) textRef.current?.focus();
  }, [autoFocus]);

  return (
    <form
      ref={form.formRef}
      className="comment-form"
      noValidate
      onSubmit={form.handleSubmit((data) => {
        setFailed(false);
        setPosted(false);
        post.mutate({ params: { slug }, body: { body: data.body, parentId: data.parentId ?? null } });
      })}
    >
      <FormField
        label={<span className="sr-only">{label}</span>}
        error={form.errors.body}
        counter={<CharCounter value={form.values.body} max={COMMENT_MAX_LENGTH} />}
      >
        {(p) => <Textarea {...p} {...form.register('body')} ref={textRef} rows={parentId ? 2 : 3} placeholder={label} />}
      </FormField>
      <div className="form-actions">
        {onDone && parentId && (
          <Button variant="ghost" onClick={onDone}>
            {T.cancel}
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={!schema} pending={post.isPending}>
          {parentId ? T.reply : T.publish}
        </Button>
      </div>
      {failed === 'error' && (
        <Notice tone="danger" live="assertive">
          {T.error}
        </Notice>
      )}
      {failed === 'auth' && (
        <Notice tone="danger" live="assertive">
          {T.sessionExpired}{' '}
          <Button size="sm" variant="secondary" onClick={() => requireLogin('comment')}>
            {T.signInAgain}
          </Button>
        </Notice>
      )}
      {posted && !parentId && (
        <p className="sr-only" role="status">
          {T.posted}
        </p>
      )}
    </form>
  );
}
