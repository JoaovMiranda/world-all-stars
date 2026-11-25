/** Per-call options of an AI backend: structured output, sampling and cancellation. */
export interface AiCallOptions {
  /** Full JSON Schema of the answer (Ollama `format`); without it the backend only asks for plain JSON. */
  schema?: Record<string, unknown>;
  /** Sampling seed; the backend default keeps runs reproducible. */
  seed?: number;
  /** Sampling temperature; the backend default is 0 (greedy). */
  temperature?: number;
  signal?: AbortSignal;
}
