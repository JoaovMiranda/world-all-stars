import type { ContactTab } from '@was/shared';

export interface Receipt {
  tab: ContactTab;
  protocol: string;
  text: string;
  notes: readonly string[];
}
