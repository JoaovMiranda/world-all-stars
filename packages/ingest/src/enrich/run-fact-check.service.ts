import type { AiProvider } from './ai-provider.interface';
import { quoteExists } from './evidence.helper';
import { factCheckPrompt } from './fact-check.prompt.helper';
import { FactCheckOutputSchema } from './fact-check.schema';
import type { FactCheckResult } from './fact-check-result.type';

/** Runs the second AI stage and applies a deterministic literal-evidence check to its answer. */
export const runFactCheck = async (provider: AiProvider, claims: unknown, source: string, facts: string): Promise<FactCheckResult> => {
  const response = await provider.generate(factCheckPrompt(claims, source, facts));
  const parsed = FactCheckOutputSchema.safeParse(response.output);
  if (!parsed.success) return { status: 'invalid', tokensIn: response.tokensIn, tokensOut: response.tokensOut };
  const corpus = `${source}\n${facts}`;
  const supported = parsed.data.claims.every((claim) => claim.status === 'supported' && quoteExists(claim.evidence_quote, corpus));
  return { status: supported ? 'supported' : 'unsupported', output: parsed.data, tokensIn: response.tokensIn, tokensOut: response.tokensOut };
};
