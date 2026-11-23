export interface HttpInput {
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
}
