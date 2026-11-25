import type { AthleteProfile } from '@was/shared';
import { describe, expect, it } from 'vitest';

import { BjjTemplate } from './bjj.template';
import { BoxingTemplate } from './boxing.template';
import { ChessTemplate } from './chess.template';
import { FallbackTemplate } from './fallback.template';
import { FootballTemplate } from './football.template';
import { IronmanTemplate } from './ironman.template';
import { OlympicTemplate } from './olympic.template';
import { profileTemplateFor } from './profile-template.registry';

const of = (sport: string, isOlympic = false) =>
  ({ sport: { slug: sport }, achievements: [{ kind: 'competition', type: 'gold', year: 2012, isOlympic }] }) as unknown as AthleteProfile;

describe('profileTemplateFor', () => {
  it.each([
    ['football', FootballTemplate],
    ['jiu-jitsu', BjjTemplate],
    ['boxing', BoxingTemplate],
    ['swimming', OlympicTemplate],
    ['chess', ChessTemplate],
    ['ironman', IronmanTemplate],
    ['triathlon', IronmanTemplate],
  ])('%s uses its own template', (sport, template) => {
    expect(profileTemplateFor(of(sport))).toBe(template);
  });

  it('a sport without a template uses the Olympic one for Olympic medallists and the fallback otherwise', () => {
    expect(profileTemplateFor(of('tennis', true))).toBe(OlympicTemplate);
    expect(profileTemplateFor(of('league-of-legends'))).toBe(FallbackTemplate);
  });
});
