/** Outcome of one AI call (D03). */
export const AiInvocationStatus = {
  Ok: 'ok',
  Error: 'error',
  Skipped: 'skipped',
} as const;
export type AiInvocationStatus = (typeof AiInvocationStatus)[keyof typeof AiInvocationStatus];
export const AI_INVOCATION_STATUS_VALUES = Object.values(AiInvocationStatus) as [AiInvocationStatus, ...AiInvocationStatus[]];
