/** SOURCE and FACTS split into numbered sentences (`S1`…, `F1`…) for citation by index (biography@7, fact-check@2). */
export interface NumberedCorpus {
  /** Every sentence ID, SOURCE first (`S1`, `S2`, …, `F1`, …). */
  ids: string[];
  /** Sentence ID → exact sentence (a literal substring of the source or the facts). */
  sentences: Map<string, string>;
  /** SOURCE rendered one sentence per line: `[S1] …`. */
  source: string;
  /** FACTS rendered one fact per line: `[F1] …`. */
  facts: string;
  /** Raw source + facts, where loose quotes are searched (tolerant comparison). */
  text: string;
}
