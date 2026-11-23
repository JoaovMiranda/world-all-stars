/** Tabs of the contact page (doc 21): `?type=message` opens the message tab. */
export const ContactTab = {
  Suggestion: 'suggestion',
  Message: 'message',
} as const;
export type ContactTab = (typeof ContactTab)[keyof typeof ContactTab];
export const CONTACT_TAB_VALUES = Object.values(ContactTab) as [ContactTab, ...ContactTab[]];
