/** Status of a contact message (doc 21). */
export const ContactStatus = {
  New: 'new',
  Answered: 'answered',
  Closed: 'closed',
} as const;
export type ContactStatus = (typeof ContactStatus)[keyof typeof ContactStatus];
export const CONTACT_STATUS_VALUES = Object.values(ContactStatus) as [ContactStatus, ...ContactStatus[]];
