import { z } from 'zod';

import {
  ADMIN_COMMENTS_TAB_VALUES,
  ADMIN_CONTACT_TAB_VALUES,
  ADMIN_INGESTION_TAB_VALUES,
  ADMIN_REVIEW_TAB_VALUES,
  ADMIN_SOURCES_TAB_VALUES,
  ADMIN_USERS_TAB_VALUES,
} from '../enums/admin-tab.enum';
import { optionalEnum, optionalText } from './url-filter.schema';

/** URL state shared by every admin queue: status filter, selected item (detail panel) and free-text filter. */
export const AdminQueueSearchSchema = z.object({ status: optionalText(), item: optionalText(), q: optionalText() });

export const AdminReviewSearchSchema = AdminQueueSearchSchema.extend({ tab: optionalEnum(ADMIN_REVIEW_TAB_VALUES) });
export const AdminIngestionSearchSchema = AdminQueueSearchSchema.extend({ tab: optionalEnum(ADMIN_INGESTION_TAB_VALUES) });
export const AdminSourcesSearchSchema = AdminQueueSearchSchema.extend({ tab: optionalEnum(ADMIN_SOURCES_TAB_VALUES) });
export const AdminUsersSearchSchema = AdminQueueSearchSchema.extend({ tab: optionalEnum(ADMIN_USERS_TAB_VALUES) });
export const AdminCommentsSearchSchema = AdminQueueSearchSchema.extend({ tab: optionalEnum(ADMIN_COMMENTS_TAB_VALUES) });
export const AdminContactSearchSchema = AdminQueueSearchSchema.extend({ tab: optionalEnum(ADMIN_CONTACT_TAB_VALUES) });
