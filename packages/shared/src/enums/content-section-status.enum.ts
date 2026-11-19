/** Editorial section of a sport page (§10). */
export const ContentSectionStatus = {
  Draft: 'draft',
  Published: 'published',
} as const;
export type ContentSectionStatus = (typeof ContentSectionStatus)[keyof typeof ContentSectionStatus];
export const CONTENT_SECTION_STATUS_VALUES = Object.values(ContentSectionStatus) as [ContentSectionStatus, ...ContentSectionStatus[]];
