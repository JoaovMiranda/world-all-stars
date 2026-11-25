import { describe, expect, it } from 'vitest';

import { OLLAMA_NUM_CTX, OLLAMA_SEED } from './ollama.const';
import { OllamaProvider } from './ollama.provider';

const capture = (response: string) => {
  const bodies: Record<string, unknown>[] = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
    return new Response(JSON.stringify({ response, prompt_eval_count: 11, eval_count: 7 }), { status: 200 });
  }) as typeof fetch;
  return { bodies, fetchImpl };
};

describe('OllamaProvider', () => {
  it('passes the JSON Schema as format, greedy sampling with the fixed seed, thinking off', async () => {
    const { bodies, fetchImpl } = capture('{"id":"S1"}');
    const schema = { type: 'object', properties: { id: { type: 'string', enum: ['S1'] } } };
    const r = await new OllamaProvider('http://ollama/', 'qwen2.5:14b', fetchImpl).generate('prompt', { schema });
    expect(r).toEqual({ output: { id: 'S1' }, tokensIn: 11, tokensOut: 7 });
    expect(bodies[0]).toMatchObject({
      model: 'qwen2.5:14b',
      format: schema,
      stream: false,
      think: false,
      options: { temperature: 0, seed: OLLAMA_SEED, num_ctx: OLLAMA_NUM_CTX },
    });
  });

  it('keeps plain JSON mode without a schema and lets a call override seed and temperature', async () => {
    const { bodies, fetchImpl } = capture('{"facts":[]}');
    await new OllamaProvider('http://ollama', 'm', fetchImpl).generate('p', { seed: 3, temperature: 0.7 });
    expect(bodies[0]).toMatchObject({ format: 'json', options: { temperature: 0.7, seed: 3 } });
  });

  it('names the model on a non-JSON answer', async () => {
    const { fetchImpl } = capture('sorry');
    await expect(new OllamaProvider('http://ollama', 'm', fetchImpl).generate('p')).rejects.toThrow('ollama:m returned non-JSON output');
  });
});
