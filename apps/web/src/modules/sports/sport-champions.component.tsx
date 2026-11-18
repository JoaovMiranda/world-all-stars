import type { AthleteSummary, CollectionReport } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { AthleteGrid } from '@/shared-ui/athlete-grid.component';
import { Notice } from '@/shared-ui/notice.component';

import { SPORTS_MESSAGES } from './sports.const';

/** "No athlete identified" report of the simulated collection (doc 18): reason + facts, each with its evidence link. */
function CollectionReportView({ report }: { report: CollectionReport }) {
  const t = useText(SPORTS_MESSAGES).page;
  return (
    <>
      <Notice tone="info">
        <b>{t.reportTitle}</b> {report.reason_pt}
      </Notice>
      {report.facts.length > 0 && (
        <>
          <h3 className="label mt-4">{t.reportFacts}</h3>
          <ul className="facts-list">
            {report.facts.map((f, i) => (
              <li key={f.source_url + i}>
                {f.text_pt}
                <a
                  className="src"
                  href={f.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.evidenceLabel(i + 1)}
                  title={t.evidence(f.evidence_quote)}
                >
                  i
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

interface SportChampionsProps {
  athletes: readonly AthleteSummary[];
  totalAthletes: number;
  report: CollectionReport | null;
}

/** Champions grid (filtered) · collection report when the sport has no athlete · empty state. */
export function SportChampions({ athletes, totalAthletes, report }: SportChampionsProps) {
  const t = useText(SPORTS_MESSAGES).page;
  if (totalAthletes === 0 && report) return <CollectionReportView report={report} />;
  return totalAthletes === 0 ? (
    <AthleteGrid athletes={[]} emptyTitle={t.noChampionsTitle} emptyText={t.noChampionsText} />
  ) : (
    <AthleteGrid athletes={athletes} emptyTitle={t.noChampionsFilter} />
  );
}
