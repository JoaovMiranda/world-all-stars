// The only ECharts entry of the app: the core plus exactly the charts and components the panels use, SVG renderer
// only. Tree-shaken this way the chunk is a fraction of `import('echarts')` (which bundles every chart, both
// renderers and all components). No AriaComponent: the wrapper exposes the chart as role=img with a text summary. A new series type or component (dataZoom, visualMap…) must be registered here.
import { BarChart, LineChart, PieChart, RadarChart } from 'echarts/charts';
import { GridComponent, LegendComponent, RadarComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { init, use } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';

use([BarChart, LineChart, PieChart, RadarChart, GridComponent, LegendComponent, RadarComponent, TitleComponent, TooltipComponent, SVGRenderer]);

export { init };
