/** `prop=imageinfo&iiprop=url|extmetadata` of one Commons file (only the fields the providers read). */
export interface CommonsImageInfo {
  url: string;
  thumburl?: string;
  descriptionurl: string;
  extmetadata?: Record<string, { value: string } | undefined>;
}
