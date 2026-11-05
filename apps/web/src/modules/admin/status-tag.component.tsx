import { Tag } from '@/shared-ui/tag.component';

import type { StatusMeta } from './admin-labels.const';

/** Tag of a status (label + tone from the admin label maps). */
export function StatusTag({ meta }: { meta: StatusMeta }) {
  return <Tag tone={meta.tone}>{meta.label}</Tag>;
}
