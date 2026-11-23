import { ClientOnly } from '@tanstack/react-router';
import type { GlobeCountry } from '@was/shared';
import { lazy, Suspense, useMemo, useState } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { countryNameFromNumeric } from './country-name.helper';
import { GlobePanel } from './globe-panel.component';
import { HOME_MESSAGES } from './home.const';
import type { SelectedCountry } from './selected-country.interface';
import { useWorldAtlas } from './use-world-atlas.hook';

interface GlobeSectionProps {
  countries: GlobeCountry[] | undefined;
}

// d3-geo + the globe live in their own chunk (doc 04: lazy-load) and only render in the browser (SSR prints the empty
// stage); the fallback keeps the same box (no layout shift).
const stage = <div className="globe-stage" aria-hidden="true" />;
const DeskGlobe = lazy(() => import('./desk-globe.component').then((m) => ({ default: m.DeskGlobe })));

/** "Campeões pelo mundo": the globe always renders (neutral countries when there are no titles). */
export function GlobeSection({ countries }: GlobeSectionProps) {
  const t = useText(HOME_MESSAGES).globe;
  const atlas = useWorldAtlas();
  const [selected, setSelected] = useState<SelectedCountry | null>(null);

  const titlesByCountry = useMemo(() => new Map((countries ?? []).map((c) => [c.isoNumeric, c.totalTitles] as const)), [countries]);

  const hint = atlas.isError ? t.mapError : atlas.isPending ? t.loadingMap : t.hint;

  return (
    <section className="card c-12" aria-labelledby="globe-title">
      <div className="card-head">
        <h2 id="globe-title">{t.title}</h2>
        <span className="label">{t.subtitle}</span>
      </div>
      <div className="globe-layout">
        <div>
          <ClientOnly fallback={stage}>
            <Suspense fallback={stage}>
              <DeskGlobe
                features={atlas.data}
                titlesByCountry={titlesByCountry}
                selectedId={selected?.id ?? null}
                onSelect={(f) => {
                  const id = String(f.id ?? '');
                  setSelected({ id, name: countryNameFromNumeric(f.id, f.properties.name) });
                }}
              />
            </Suspense>
          </ClientOnly>
          <p className="globe-hint">{hint}</p>
        </div>
        <GlobePanel countries={countries} selected={selected} onSelectCountry={(c) => setSelected({ id: c.isoNumeric, name: c.name })} />
      </div>
    </section>
  );
}
