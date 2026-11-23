import type { AiProvider, AiResult } from './ai';

/**
 * Base of every AI backend (Ollama today; a paid API is a follow-up). One call = one prompt in, JSON out plus token
 * counts; recording, validation and the human queue stay in the enrichment services, never in the provider.
 */
export abstract class BaseAiProvider implements AiProvider {
  abstract readonly provider: string;
  abstract readonly model: string;
  /** Model revision when the backend reports one ('' when unknown). */
  readonly version: string = '';

  /** Sends one prompt and returns the parsed JSON output. */
  abstract generate(prompt: string, signal?: AbortSignal): Promise<AiResult>;

  /** `provider:model`, for logs and reports. */
  get label(): string {
    return `${this.provider}:${this.model}`;
  }

  /** Parses the model's JSON text; a non-JSON answer becomes an error that names the model. */
  protected parseOutput(text: string): unknown {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new Error(`${this.label} returned non-JSON output`);
    }
  }
}
