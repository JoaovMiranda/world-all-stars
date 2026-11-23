import type { EChartsOption } from 'echarts';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { chartAxis, chartBaseOption, cssVar } from './chart-theme.helper';
import type { ChartTheme } from './chart-theme.interface';
import { useEffectiveTheme } from './theme.store';
import { UI_MESSAGES } from './ui-text.const';

interface ChartContainerProps {
  /** Builds the option from the current theme tokens (called again on theme change). Keep it stable (useCallback). */
  option: (theme: ChartTheme) => EChartsOption;
  /** Accessible name of the chart image. */
  ariaLabel: string;
  /** Height in px (default 280). */
  height?: number;
  /** Text alternative (summary or a small table) for screen readers. */
  summary?: ReactNode;
}

type EChartsModule = typeof import('./echarts-setup');
let echartsPromise: Promise<EChartsModule> | null = null;
/** ECharts is loaded on demand, once, in its own tree-shaken chunk (doc 14: LCP/TBT). */
const loadECharts = () => (echartsPromise ??= import('./echarts-setup'));

/** ECharts wrapper: lazy library, SVG renderer, theme from CSS variables, re-render on theme change and resize. */
export function ChartContainer({ option, ariaLabel, height = 280, summary }: ChartContainerProps) {
  const ui = useText(UI_MESSAGES);
  const ref = useRef<HTMLDivElement>(null);
  const chart = useRef<ReturnType<EChartsModule['init']> | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const theme = useEffectiveTheme();
  // ECharts (~160 KB) is fetched only when the chart gets near the viewport: on a phone the charts sit below the
  // fold, and downloading them during the first paint delays the LCP image (doc 12).
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') return setNear(true);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let disposed = false;
    const el = ref.current;
    if (!el || !near) return;
    loadECharts()
      .then((echarts) => {
        if (disposed) return;
        chart.current = echarts.init(el, null, { renderer: 'svg' });
        setReady(true);
      })
      .catch(() => setFailed(true));
    const observer = new ResizeObserver(() => chart.current?.resize());
    observer.observe(el);
    return () => {
      disposed = true;
      observer.disconnect();
      chart.current?.dispose();
      chart.current = null;
    };
  }, [near]);

  useEffect(() => {
    if (!ready || !chart.current) return;
    const built = option({ cssVar, axis: chartAxis });
    chart.current.setOption({ ...chartBaseOption(), ...built }, true);
  }, [ready, option, theme]);

  if (failed) return <p className="muted">{ui.chartError}</p>;
  return (
    <figure className="m-0">
      <div ref={ref} className="chart" style={{ '--chart-h': `${height}px` } as CSSProperties} role="img" aria-label={ariaLabel} aria-busy={!ready} />
      {summary && <figcaption className="sr-only">{summary}</figcaption>}
    </figure>
  );
}
