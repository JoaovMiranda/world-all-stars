/** Link targets the markdown parser keeps: http(s), mailto, site-relative paths and in-page anchors (T4.2). */
export const SAFE_MARKDOWN_HREF = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i;
