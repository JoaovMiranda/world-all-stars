import type { AthleteSummary, CollectionReport } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { AthleteGrid } from '@/shared-ui/athlete-grid.component';
import { Notice } from '@/shared-ui/notice.component';
import { useDisclosure } from '@/shared-ui/use-disclosure.hook';

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
              <FactItem key={f.source_url + i} fact={f} n={i + 1} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

/** One fact: the source link plus a toggle that shows the literal evidence (not hover-only: WCAG 1.4.13 / 2.1.1). */
function FactItem({ fact, n }: { fact: CollectionReport['facts'][number]; n: number }) {
  const t = useText(SPORTS_MESSAGES).page;
  const quote = useDisclosure();
  return (
    <li>
      {fact.text_pt}
      <a className="src" href={fact.source_url} target="_blank" rel="noopener noreferrer" aria-label={t.evidenceLabel(n)}>
        i
      </a>
      {fact.evidence_quote && (
        <>
          {' '}
          <button type="button" className="info-btn" aria-label={t.evidenceToggle(n)} {...quote.buttonProps}>
            “
          </button>
          {quote.open && (
            <blockquote id={quote.contentId} className="evidence-quote">
              {t.evidence(fact.evidence_quote)}
            </blockquote>
          )}
        </>
      )}
    </li>
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
