import { Button } from './button.component';
import { UI_TEXT } from './ui-text.const';

interface ErrorStateProps {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

/** Failure block with retry (role=alert). Defaults to the generic kit texts. */
export function ErrorState({ title = UI_TEXT.errorTitle, description = UI_TEXT.errorText, retryLabel = UI_TEXT.retry, onRetry, isRetrying = false }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <span className="empty-state-mark" aria-hidden="true">
        !
      </span>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-text">{description}</p>
      {onRetry && (
        <div className="empty-state-action">
          <Button onClick={onRetry} disabled={isRetrying}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
