/** Subjects of the contact form (doc 21). */
export const ContactTopic = {
  DataError: 'data_error',
  Press: 'press',
  Privacy: 'privacy',
  Partnership: 'partnership',
  Other: 'other',
} as const;
export type ContactTopic = (typeof ContactTopic)[keyof typeof ContactTopic];
export const CONTACT_TOPIC_VALUES = Object.values(ContactTopic) as [ContactTopic, ...ContactTopic[]];
