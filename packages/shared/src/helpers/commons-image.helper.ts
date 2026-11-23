// Wikimedia Commons images (doc 02: hotlinked, never copied). The web asks for a thumbnail of the displayed size and,
// with the real API, gets it through the server's same-origin proxy (`/img/wm/…`): no extra DNS/TLS connection for
// the LCP photo, long browser caching, and no third-party cookie. Both sides use these helpers, so the proxy only ever
// fetches the exact Commons thumbnail URLs built here (no open proxy, no SSRF).

import { IMAGE_PROXY_PREFIX, WIKIMEDIA_STEPS } from '../consts/commons-image.const';
import type { CommonsFileRef, WikimediaFile } from '../interfaces/commons-file.interface';
import type { WikimediaStep } from '../types/wikimedia-step.type';

export const isWikimediaStep = (n: number): n is WikimediaStep => (WIKIMEDIA_STEPS as readonly number[]).includes(n);

// upload.wikimedia.org/wikipedia/commons/a/ab/File.jpg  or  …/commons/thumb/a/ab/File.jpg/960px-File.jpg
const COMMONS = /^https:\/\/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/([\w-]+)\/(?:thumb\/)?([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+)(?:\/[^/?#]+)?$/i;
const PROJECT = /^[a-z][\w-]{1,30}$/;
/** A file name as Commons stores it (decoded): no path separators or control characters, a raster or SVG extension. */
const FILE = /^[^/\\?#\u0000-\u001f]{1,240}\.(jpe?g|png|gif|webp|tiff?|svg)$/i;

/** Percent-encoding Commons uses in its URLs (also `( ) ' ! *`, which encodeURIComponent leaves as is). */
const encodeFile = (file: string): string => encodeURIComponent(file).replace(/[!'()*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);

const decode = (s: string): string | null => {
  try {
    return decodeURIComponent(s);
  } catch {
    return null;
  }
};

/** Validates the pieces of a Commons file (from a URL or from the proxy path). */
export const commonsFileRef = (project: string, a: string, ab: string, rawFile: string, encoded = true): CommonsFileRef | null => {
  const file = encoded ? decode(rawFile) : rawFile;
  if (
    !file ||
    !PROJECT.test(project) ||
    !/^[0-9a-f]$/i.test(a) ||
    !/^[0-9a-f]{2}$/i.test(ab) ||
    !ab.toLowerCase().startsWith(a.toLowerCase()) ||
    !FILE.test(file)
  )
    return null;
  return { project, a: a.toLowerCase(), ab: ab.toLowerCase(), file };
};

/** Commons thumbnail URL of a validated file (SVG thumbnails are PNG, TIFF are JPEG: Commons naming rules). */
export const commonsThumbUrl = ({ project, a, ab, file }: CommonsFileRef, width: number): string => {
  const name = encodeFile(file);
  const suffix = /\.svg$/i.test(file) ? '.png' : /\.tiff?$/i.test(file) ? '.jpg' : '';
  return `https://upload.wikimedia.org/wikipedia/${project}/thumb/${a}/${ab}/${name}/${width}px-${name}${suffix}`;
};

/** The Commons file behind an image URL, or null when the URL is not a Commons upload. */
export const wikimediaFile = (url: string): WikimediaFile | null => {
  const m = COMMONS.exec(url);
  if (!m) return null;
  const ref = commonsFileRef(m[1]!, m[2]!, m[3]!, m[4]!);
  if (!ref) return null;
  const base = `https://upload.wikimedia.org/wikipedia/${ref.project}`;
  return {
    ...ref,
    original: `${base}/${ref.a}/${ref.ab}/${encodeFile(ref.file)}`,
    thumb: (width) => commonsThumbUrl(ref, width),
    proxied: (width) => `${IMAGE_PROXY_PREFIX}/${ref.project}/${ref.a}/${ref.ab}/${encodeFile(ref.file)}/${width}`,
  };
};

/** Smallest pre-rendered step that covers `width` CSS px (the largest step when none does). */
export const wikimediaStep = (width: number): WikimediaStep => WIKIMEDIA_STEPS.find((s) => s >= width) ?? 1280;
