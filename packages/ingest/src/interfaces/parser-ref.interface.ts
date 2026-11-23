/** Parser identity stored with every observation (re-parsing bumps `version`). */
export interface ParserRef {
  key: string;
  version: string;
}
