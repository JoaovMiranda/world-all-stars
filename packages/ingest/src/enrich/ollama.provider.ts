import type { AiCallOptions } from './ai-call-options.interface';
import type { AiResult } from './ai-result.interface';
import { BaseAiProvider } from './base-ai.provider';
import { OLLAMA_NUM_CTX, OLLAMA_SEED } from './ollama.const';

/**
 * Ollama (local): POST /api/generate. `format` is the call's JSON Schema (structured output) or plain `'json'`;
 * sampling is greedy (`temperature: 0`) with a fixed seed unless the call overrides them; thinking is off.
 * Skipped when OLLAMA_URL is not configured.
 */
export class OllamaProvider extends BaseAiProvider {
  readonly provider = 'ollama';
  constructor(
    readonly url: string,
    readonly model: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    super();
  }
  static fromEnv(): OllamaProvider | null {
    return process.env.OLLAMA_URL ? new OllamaProvider(process.env.OLLAMA_URL, process.env.OLLAMA_MODEL ?? 'qwen2.5:14b') : null;
  }
  async generate(prompt: string, options: AiCallOptions = {}): Promise<AiResult> {
    const body = {
      model: this.model,
      prompt,
      format: options.schema ?? 'json',
      stream: false,
      think: false,
      options: { temperature: options.temperature ?? 0, seed: options.seed ?? OLLAMA_SEED, num_ctx: OLLAMA_NUM_CTX },
    };
    const res = await this.fetchImpl(`${this.url.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
      ...(options.signal ? { signal: options.signal } : {}),
    });
    if (!res.ok) throw new Error(`ollama ${res.status}`);
    const json = (await res.json()) as { response: string; prompt_eval_count?: number; eval_count?: number };
    return { output: this.parseOutput(json.response), tokensIn: json.prompt_eval_count ?? 0, tokensOut: json.eval_count ?? 0 };
  }
}
