import { ContactTab } from '@was/shared';
import { useLocation } from '@tanstack/react-router';

import { ButtonLink } from '@/shared-ui/button-link.component';

import { ErrorScreen } from './error-screen.component';
import { ERRORS_TEXT } from './errors.const';

const t = ERRORS_TEXT.notFound;

/** P20 404: the search row stays in the header; message, missing path and shortcuts. */
export function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <ErrorScreen
      code={t.code}
      eyebrow={t.eyebrow}
      title={t.title}
      text={t.text}
      detail={
        <p className="error-path">
          {t.path}: <code>{pathname}</code>
        </p>
      }
      actions={
        <>
          <ButtonLink to="/" variant="primary">
            {t.home}
          </ButtonLink>
          <ButtonLink to="/contact" search={{ tipo: ContactTab.Message }}>
            {t.report}
          </ButtonLink>
        </>
      }
    />
  );
}
