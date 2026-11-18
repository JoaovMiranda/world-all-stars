import type { GlobeCountry } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { ButtonLink } from '@/shared-ui/button-link.component';
import { Chip } from '@/shared-ui/chip.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { Skeleton } from '@/shared-ui/skeleton.component';

import { HOME_MESSAGES } from './home.const';

export interface SelectedCountry {
  id: string;
  name: string;
}

interface GlobePanelProps {
  countries: GlobeCountry[] | undefined;
  selected: SelectedCountry | null;
  onSelectCountry: (country: GlobeCountry) => void;
}

function TitlesLegend() {
  const t = useText(HOME_MESSAGES).globe;
  return (
    <div className="globe-legend" aria-hidden="true">
      <span>{t.legendNone}</span>
      <span className="globe-legend-ramp" />
      <span>{t.legendMore}</span>
    </div>
  );
}

function SelectedCountryCard({ selected, data }: { selected: SelectedCountry; data: GlobeCountry | undefined }) {
  const t = useText(HOME_MESSAGES).globe;
  const entries = [...(data?.sports ?? [])].sort((a, b) => b.titles - a.titles);
  const max = entries[0]?.titles ?? 1;
  return (
    <div className="globe-selected">
      <span className="label">{t.selected}</span>
      <h3 className="mt-1 text-lg">
        {data?.flag ? `${data.flag} ` : ''}
        {data?.name ?? selected.name}
      </h3>
      <div className="display-num mt-1.5 text-3xl">{data?.totalTitles ?? 0}</div>
      <span className="label">{t.titles}</span>
      {data && entries.length > 0 ? (
        <>
          <div className="globe-bars">
            {entries.map(({ sport, titles }) => (
              <div className="globe-bar" key={sport.slug}>
                <span>{sport.name}</span>
                <div className="track">
                  <div className="fill" style={{ width: `${(titles / max) * 100}%` }} />
                </div>
                <b className="num">{titles}</b>
              </div>
            ))}
          </div>
          {data && (
            <ButtonLink to="/athletes" search={{ country: data.iso2 }}>
              {t.seeAthletes}
            </ButtonLink>
          )}
        </>
      ) : (
        <p className="muted mt-2 text-sm">{t.noTitlesCountry}</p>
      )}
    </div>
  );
}

/** Side panel of the globe: selected country + list of countries with titles, or the empty explanation. */
export function GlobePanel({ countries, selected, onSelectCountry }: GlobePanelProps) {
  const t = useText(HOME_MESSAGES).globe;
  if (!countries) {
    return (
      <div className="globe-panel" aria-busy="true">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-6 w-48" />
        <Skeleton className="mt-4 h-20 w-full" />
      </div>
    );
  }

  const selectedData = selected ? countries.find((c) => c.isoNumeric === selected.id) : undefined;

  return (
    <div className="globe-panel" aria-live="polite">
      {selected && <SelectedCountryCard selected={selected} data={selectedData} />}
      {countries.length === 0 ? (
        <EmptyState title={t.emptyTitle} compact>
          <p>{t.emptyText}</p>
          <TitlesLegend />
          {!selected && <p className="mt-2">{t.emptyHint}</p>}
        </EmptyState>
      ) : (
        <>
          <div className="label mt-3.5">{t.countriesWithTitles}</div>
          <div className="row mt-2 gap-1.5">
            {countries.map((c) => (
              <Chip key={c.isoNumeric} pressed={c.isoNumeric === selected?.id} onClick={() => onSelectCountry(c)}>
                <span aria-hidden="true">{c.flag} </span>
                {c.name}
              </Chip>
            ))}
          </div>
          <TitlesLegend />
        </>
      )}
    </div>
  );
}
