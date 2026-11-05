import { ContactTab } from '@was/shared';
import { type ErrorComponentProps, useRouter } from '@tanstack/react-router';

import { Button } from '@/shared-ui/button.component';
import { ButtonLink } from '@/shared-ui/button-link.component';

import { ErrorScreen } from './error-screen.component';
import { ERRORS_TEXT } from './errors.const';

const t = ERRORS_TEXT.generic;

/** Generic error page (router `defaultErrorComponent`): retry re-runs the route; details only in dev builds. */
export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <ErrorScreen
      code={t.code}
      eyebrow={t.eyebrow}
      title={t.title}
      text={t.text}
      actions={
        <>
          <Button
            variant="primary"
            onClick={() => {
              reset();
              void router.invalidate();
            }}
          >
            {t.retry}
          </Button>
          <ButtonLink to="/">{t.home}</ButtonLink>
          <ButtonLink to="/contact" search={{ tipo: ContactTab.Message }} variant="link" size="sm">
            {t.report}
          </ButtonLink>
        </>
      }
    >
      {import.meta.env.DEV && error instanceof Error && (
        <details className="error-details">
          <summary>{t.details}</summary>
          <pre>{error.stack ?? error.message}</pre>
        </details>
      )}
    </ErrorScreen>
  );
}
