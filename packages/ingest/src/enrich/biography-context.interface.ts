import type { Database } from '@was/db';

import type { AiProvider } from './ai-provider.interface';
import type { EnrichItem } from './enrich-item.interface';
import type { NumberedCorpus } from './numbered-corpus.interface';

/** Everything one athlete's biography generations share: database, provider, prompt rows, the item and its corpus. */
export interface BiographyContext {
  db: Database;
  provider: AiProvider;
  modelId: string;
  promptId: string;
  factPromptId: string;
  item: EnrichItem;
  corpus: NumberedCorpus;
}
