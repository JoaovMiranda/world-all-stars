/** `sport_content_sections.section_key` of the row that carries a sport's Commons image (media_link_id, no text). */
export const SPORT_IMAGE_SECTION_KEY = 'image';

/** Repo-relative data file of the collected sport images (`pnpm ingest sport-images` writes it, the seed reads it). */
export const SPORT_IMAGES_DATA_FILE = 'data/content/sport-images.json';

/** Repo-relative review report of the sport images (sport → image, author, license, or why there is none). */
export const SPORT_IMAGES_REVIEW_FILE = 'data/review/sport-images.md';
