import { COMMENT_MAX_LENGTH } from '@was/shared';
import { useEffect, useId, useRef, useState } from 'react';

import { isApiError } from '@/data/api-error.error';
import { editComment } from '@/data/endpoints/comments.query';
import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { Notice } from '@/shared-ui/notice.component';
import { Textarea } from '@/shared-ui/textarea.component';

import { COMMENT_MODERATION_MESSAGES } from './comment-moderation.const';

interface CommentEditFormProps {
  id: string;
  body: string;
  onDone: () => void;
}

/** Inline edit of my comment (T3.3): the server applies the same rules as posting and the 10-minute window. */
export function CommentEditForm({ id, body, onDone }: CommentEditFormProps) {
  const t = useText(COMMENT_MODERATION_MESSAGES);
  const hintId = useId();
  const [text, setText] = useState(body);
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const save = editComment.useMutation({
    onSuccess: () => onDone(),
    onError: (e) => setError(isApiError(e) ? (e.body.errors?.body ?? e.body.message ?? t.editFailed) : t.editFailed),
  });
  useEffect(() => field.current?.focus(), []);
  return (
    <form
      className="comment-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        save.mutate({ params: { id }, body: { body: text } });
      }}
    >
      <Textarea
        ref={field}
        aria-label={t.editLabel}
        aria-describedby={hintId}
        aria-invalid={error ? true : undefined}
        maxLength={COMMENT_MAX_LENGTH * 2}
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p id={hintId} className="muted text-sm">
        {t.editHint}
      </p>
      {error && (
        <Notice tone="danger" live="assertive">
          {error}
        </Notice>
      )}
      <div className="row">
        <Button type="submit" size="sm" variant="primary" pending={save.isPending}>
          {t.save}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}
