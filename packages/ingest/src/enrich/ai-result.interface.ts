/** One AI call: the parsed JSON output plus token counts. */
export interface AiResult {
  output: unknown;
  tokensIn: number;
  tokensOut: number;
}
