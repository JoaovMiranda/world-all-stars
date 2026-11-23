import type { LogFormat } from './log-format.type';

export interface RequestLogOptions {
  enabled: boolean;
  /** `json` (production default): one object per line, for the log platform (Fly, Better Stack…). `text`: dev. */
  format: LogFormat;
  /** Requests slower than this are logged at `warn` (and always, even with LOG_REQUESTS=0). */
  slowMs: number;
}
