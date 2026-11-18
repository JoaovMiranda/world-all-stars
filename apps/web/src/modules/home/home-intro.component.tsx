import { useText } from '@/i18n/use-text.hook';
import { ButtonLink } from '@/shared-ui/button-link.component';

import { HOME_MESSAGES } from './home.const';
import { RandomAthleteButton } from './random-athlete-button.component';

interface HomeIntroProps {
  /** undefined while loading. */
  athleteSlugs: readonly string[] | undefined;
  isError?: boolean;
}

export function HomeIntro({ athleteSlugs, isError = false }: HomeIntroProps) {
  const t = useText(HOME_MESSAGES).intro;
  return (
    <div className="home-intro">
      <span className="label ornament">{t.kicker}</span>
      <h1>
        {t.titleBefore}
        <em>{t.titleHighlight}</em>
        {t.titleAfter}
      </h1>
      <p className="muted home-intro-sub">{t.subtitle}</p>
      <RandomAthleteButton athleteSlugs={athleteSlugs} isError={isError}>
        <ButtonLink to="/athletes">{t.allAthletes}</ButtonLink>
      </RandomAthleteButton>
    </div>
  );
}
