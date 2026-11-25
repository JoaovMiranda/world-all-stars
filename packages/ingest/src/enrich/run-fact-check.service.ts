import type { AiProvider } from './ai-provider.interface';
import { factCheckPrompt } from './fact-check.prompt.helper';
import { FactCheckOutputSchema } from './fact-check.schema';
import type { FactCheckResult } from './fact-check-result.type';
import { resolveEvidence } from './numbered-corpus.helper';
import type { NumberedCorpus } from './numbered-corpus.interface';
import { factCheckJsonSchema } from './structured-output.helper';

/**
 * Runs the second AI stage (fact-check@2) with structured output and audits its answer deterministically: each claim
 * needs a `supported` verdict whose evidence resolves to a sentence of SOURCE/FACTS (by ID, or by tolerant match).
 * Verdicts are matched by claim ID (`C1`…), else by order. `unsupported` lists the texts of the failing claims.
 */
export const runFactCheck = async (
  provider: AiProvider,
  claims: { text: string; evidence_id: string | null; evidence_quote: string }[],
  corpus: NumberedCorpus,
  seed?: number,
): Promise<FactCheckResult> => {
  const claimIds = claims.map((_, i) => `C${i + 1}`);
  const response = await provider.generate(factCheckPrompt(claims, corpus), {
    schema: factCheckJsonSchema(claimIds, corpus.ids),
    ...(seed === undefined ? {} : { seed }),
  });
  const parsed = FactCheckOutputSchema.safeParse(response.output);
  if (!parsed.success) return { status: 'invalid', tokensIn: response.tokensIn, tokensOut: response.tokensOut };
  const verdicts = claimIds.map(
    (id, i) => parsed.data.claims.find((c) => c.claim === id) ?? (parsed.data.claims.some((c) => c.claim) ? undefined : parsed.data.claims[i]),
  );
  const evidence = verdicts.map((v) => {
    const raw = v?.evidence ?? v?.evidence_quote;
    return raw ? resolveEvidence(corpus, raw).quote : null;
  });
  const unsupported = claims.filter((_, i) => verdicts[i]?.status !== 'supported' || !evidence[i]).map((c) => c.text);
  return {
    status: unsupported.length ? 'unsupported' : 'supported',
    output: parsed.data,
    evidence,
    unsupported,
    tokensIn: response.tokensIn,
    tokensOut: response.tokensOut,
  };
};
