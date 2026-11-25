import type { AiCallOptions } from './ai-call-options.interface';
import type { AiResult } from './ai-result.interface';

/** Contract of an AI backend (Ollama first): one prompt in, JSON out. */
export interface AiProvider {
  provider: string;
  model: string;
  version: string;
  generate(prompt: string, options?: AiCallOptions): Promise<AiResult>;
}
