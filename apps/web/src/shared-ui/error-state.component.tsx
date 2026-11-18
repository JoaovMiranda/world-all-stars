import { useText } from '@/i18n/use-text.hook';

import { Button } from './button.component';
import { UI_MESSAGES } from './ui-text.const';

interface ErrorStateProps {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

/** Failure block with retry (role=alert). Defaults to the generic kit texts. */
export function ErrorState({ title, description, retryLabel, onRetry, isRetrying = false }: ErrorStateProps) {
  const ui = useText(UI_MESSAGES);
  return (
    <div className="error-state" role="alert">
      <span className="empty-state-mark" aria-hidden="true">
        !
      </span>
      <p className="empty-state-title">{title ?? ui.errorTitle}</p>
      <p className="empty-state-text">{description ?? ui.errorText}</p>
      {onRetry && (
        <div className="empty-state-action">
          <Button onClick={onRetry} disabled={isRetrying}>
            {retryLabel ?? ui.retry}
          </Button>
        </div>
      )}
    </div>
  );
}
