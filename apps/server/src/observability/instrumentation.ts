// OpenTelemetry bootstrap, loaded BEFORE the app (`node --import ./instrumentation.js main.js`) so the pg
// instrumentation can patch the driver before it is imported. A no-op unless tracing is configured:
//   OTEL_EXPORTER_OTLP_ENDPOINT=https://collector:4318   (traces over OTLP/HTTP; Grafana, Honeycomb, Better Stack…)
//   OTEL_TRACES_EXPORTER=console                        (dev: print spans)
// Spans: one per HTTP request (Hono middleware, route + status) and one per Postgres query (statement + duration):
// the slow requests and the queries behind them. OTEL_SERVICE_NAME defaults to world-all-stars.
const enabled = !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT || process.env.OTEL_TRACES_EXPORTER === 'console';

if (enabled) {
  process.env.OTEL_SERVICE_NAME ??= 'world-all-stars';
  const [{ NodeSDK }, { PgInstrumentation }] = await Promise.all([import('@opentelemetry/sdk-node'), import('@opentelemetry/instrumentation-pg')]);
  // No traceExporter given: the SDK builds it from OTEL_TRACES_EXPORTER / OTEL_EXPORTER_OTLP_* (standard env).
  const sdk = new NodeSDK({ instrumentations: [new PgInstrumentation({ enhancedDatabaseReporting: false })] });
  sdk.start();
  const stop = () => void sdk.shutdown().catch(() => undefined);
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
  console.log(`[otel] tracing on (${process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'console'}, service ${process.env.OTEL_SERVICE_NAME})`);
}

export {};
