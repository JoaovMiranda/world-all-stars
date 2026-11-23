import { describe, expect, it } from 'vitest';

import type { AiResult } from './ai-result.interface';
import { BaseAiProvider } from './base-ai.provider';

class EchoAiProvider extends BaseAiProvider {
  readonly provider = 'echo';
  readonly model = 'echo-1';
  constructor(private readonly reply: string) {
    super();
  }
  async generate(prompt: string): Promise<AiResult> {
    return { output: this.parseOutput(this.reply), tokensIn: prompt.length, tokensOut: this.reply.length };
  }
}

describe('BaseAiProvider', () => {
  it('parses JSON output and labels the model', async () => {
    const ai = new EchoAiProvider('{"facts":[]}');
    expect(ai.label).toBe('echo:echo-1');
    expect(ai.version).toBe('');
    expect(await ai.generate('hello')).toEqual({ output: { facts: [] }, tokensIn: 5, tokensOut: 12 });
  });

  it('names the model when the output is not JSON', async () => {
    await expect(new EchoAiProvider('sorry, no').generate('x')).rejects.toThrow('echo:echo-1 returned non-JSON output');
  });
});
