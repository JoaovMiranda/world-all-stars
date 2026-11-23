import type { AttributeValue } from './attribute-value.type';

export interface RankingDefinition {
  key: string;
  title: string;
  scope: Record<string, AttributeValue>;
}
