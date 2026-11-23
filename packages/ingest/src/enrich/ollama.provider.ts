import type { AiResult } from './ai-result.interface';
import { BaseAiProvider } from './base-ai.provider';

/** Ollama (local): POST /api/generate with JSON output. Skipped when OLLAMA_URL is not configured. */
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
  async generate(prompt: string, signal?: AbortSignal): Promise<AiResult> {
    const res = await this.fetchImpl(`${this.url.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({ model: this.model, prompt, format: 'json', stream: false }),
      headers: { 'content-type': 'application/json' },
      ...(signal ? { signal } : {}),
    });
    if (!res.ok) throw new Error(`ollama ${res.status}`);
    const json = (await res.json()) as { response: string; prompt_eval_count?: number; eval_count?: number };
    return { output: JSON.parse(json.response), tokensIn: json.prompt_eval_count ?? 0, tokensOut: json.eval_count ?? 0 };
  }
}
