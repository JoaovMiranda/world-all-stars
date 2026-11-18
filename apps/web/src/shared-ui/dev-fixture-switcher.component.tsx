import { FIXTURE_MODE_VALUES, type FixtureMode } from '@was/shared';
import { useId } from 'react';

import { DATA_SOURCE } from '@/data/data-layer.const';
import { fixtureModeStore, useFixtureMode } from '@/data/fixture-mode.store';
import { useText } from '@/i18n/use-text.hook';

import { UI_MESSAGES } from './ui-text.const';

/** Small dev-only control (bottom-left) to switch ?fixture= sample · empty · loading · error. Not rendered in prod. */
export function DevFixtureSwitcher() {
  const ui = useText(UI_MESSAGES);
  const mode = useFixtureMode();
  const id = useId();
  if (!import.meta.env.DEV || DATA_SOURCE !== 'fixtures') return null;
  return (
    <div className="dev-switcher">
      <label htmlFor={id}>{ui.devFixture}</label>
      <select id={id} aria-label={ui.devFixtureLabel} value={mode} onChange={(e) => fixtureModeStore.set(e.target.value as FixtureMode)}>
        {FIXTURE_MODE_VALUES.map((m) => (
          <option key={m} value={m}>
            {ui.devFixtureModes[m]}
          </option>
        ))}
      </select>
    </div>
  );
}
