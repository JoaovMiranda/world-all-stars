import { AthleteProfileTab, type AthleteProfile } from '@was/shared';
import { Link } from '@tanstack/react-router';

import { useText } from '@/i18n/use-text.hook';
import { SourceInfo } from '@/shared-ui/source-info.component';

import { fieldLabel, hasConflict, provenanceOf } from './athlete-profile.helper';
import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';

/** ⓘ with the source of one profile field, plus a "conflito" tag (→ Sources tab) when the sources disagree. */
export function FieldSource({ profile, field }: { profile: AthleteProfile; field: string }) {
  const profileText = useText(ATHLETE_PROFILE_MESSAGES);
  const prov = provenanceOf(profile, field);
  return (
    <>
      {prov && <SourceInfo source={prov.source} field={fieldLabel(field)} />}
      {hasConflict(profile, field) && (
        <>
          {' '}
          <Link
            className="tag tag-danger"
            to="/athletes/$slug"
            params={{ slug: profile.slug }}
            search={{ tab: AthleteProfileTab.Sources }}
            title={profileText.infobox.conflictTitle}
          >
            {profileText.infobox.conflict}
            <span className="sr-only">: {profileText.infobox.conflictTitle}</span>
          </Link>
        </>
      )}
    </>
  );
}
