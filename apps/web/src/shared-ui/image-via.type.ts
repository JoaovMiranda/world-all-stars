/**
 * Where thumbnails come from: `proxy` = the server's same-origin `/img/wm/…` (real API: one connection, long cache,
 * no third-party cookie); `direct` = upload.wikimedia.org (fixture mode has no server behind it).
 */
export type ImageVia = 'proxy' | 'direct';
