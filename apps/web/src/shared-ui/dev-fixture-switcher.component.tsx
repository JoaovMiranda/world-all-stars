import { FIXTURE_MODE_VALUES, type FixtureMode } from '@was/shared';
import { useId } from 'react';

import { DATA_SOURCE } from '@/data/data-layer.const';
import { fixtureModeStore, useFixtureMode } from '@/data/fixture-mode.store';

import { UI_TEXT } from './ui-text.const';

/** Small dev-only control (bottom-left) to switch ?fixture= sample · empty · loading · error. Not rendered in prod. */
export function DevFixtureSwitcher() {
  const mode = useFixtureMode();
  const id = useId();
  if (!import.meta.env.DEV || DATA_SOURCE !== 'fixtures') return null;
  return (
    <div className="dev-switcher">
      <label htmlFor={id}>{UI_TEXT.devFixture}</label>
      <select id={id} aria-label={UI_TEXT.devFixtureLabel} value={mode} onChange={(e) => fixtureModeStore.set(e.target.value as FixtureMode)}>
        {FIXTURE_MODE_VALUES.map((m) => (
          <option key={m} value={m}>
            {UI_TEXT.devFixtureModes[m]}
          </option>
        ))}
      </select>
    </div>
  );
}
