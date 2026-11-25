/** Options of the `sport-images` provider: limit the run to some sports (slugs) or to the first N. */
export interface SportImagesOptions {
  only?: string[] | undefined;
  limit?: number | undefined;
}
