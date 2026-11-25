import { useState } from 'react';

import { reportComment } from '@/data/endpoints/comments.query';
import { useText } from '@/i18n/use-text.hook';
import { useSession } from '@/session/use-session.hook';
import { Button } from '@/shared-ui/button.component';
import { ConfirmDialog } from '@/shared-ui/confirm-dialog.component';

import { COMMENT_MODERATION_MESSAGES } from './comment-moderation.const';

/** "Report" on someone else's comment (T3.3): confirm, then the comment enters the moderation queue. Idempotent. */
export function CommentReportButton({ id, author }: { id: string; author: string }) {
  const t = useText(COMMENT_MODERATION_MESSAGES);
  const { requireLogin } = useSession();
  const [open, setOpen] = useState(false);
  const report = reportComment.useMutation();
  if (report.isSuccess)
    return (
      <span role="status" className="muted text-sm">
        {t.reported}
      </span>
    );
  return (
    <>
      <Button variant="link" aria-label={t.reportLabel(author)} onClick={() => requireLogin('react') && setOpen(true)}>
        {t.report}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t.reportTitle}
        confirmLabel={t.reportConfirm}
        confirmVariant="danger"
        onConfirm={() => report.mutateAsync({ params: { id }, body: {} })}
      >
        <p>{t.reportText}</p>
      </ConfirmDialog>
    </>
  );
}
