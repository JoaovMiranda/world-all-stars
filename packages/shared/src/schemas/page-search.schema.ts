import { z } from 'zod';

import { ATHLETE_PROFILE_TAB_VALUES } from '../enums/athlete-profile-tab.enum';
import { COMMENT_SORT_VALUES } from '../enums/comment-sort.enum';
import { CONTACT_TAB_VALUES } from '../enums/contact-tab.enum';
import { NOTIFICATION_FILTER_VALUES } from '../enums/notification-filter.enum';
import { IsoDateSchema } from './iso-date.schema';
import { optionalEnum, optionalText } from './url-filter.schema';

/** URL state of /athletes/$slug: active tab, athletes in the Analysis tab (comma slugs), comments order. */
export const AthleteProfileSearchSchema = z.object({
  tab: optionalEnum(ATHLETE_PROFILE_TAB_VALUES),
  compare: optionalText(),
  sort: optionalEnum(COMMENT_SORT_VALUES),
});

/** URL state of /contact (doc 21: `?type=message` opens the message tab). */
export const ContactSearchSchema = z.object({ type: optionalEnum(CONTACT_TAB_VALUES) });

/** URL state of the home: `date` simulates another day for "On this day" and the calendar. */
export const HomeSearchSchema = z.object({ date: IsoDateSchema.optional().catch(undefined) });

/** URL state of /me/notifications (E4): read-state filter (`?filter=unread|read`). */
export const NotificationsSearchSchema = z.object({ filter: optionalEnum(NOTIFICATION_FILTER_VALUES) });
