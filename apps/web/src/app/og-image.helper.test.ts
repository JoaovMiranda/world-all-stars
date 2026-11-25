import { describe, expect, it } from 'vitest';

import { ogImageUrl } from './og-image.helper';

const PHOTO = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Pele_1970.jpg/960px-Pele_1970.jpg';

describe('ogImageUrl', () => {
  it('uses a freely licensed Commons photo through the same-origin proxy', () => {
    expect(ogImageUrl('https://was.test', PHOTO, 'CC BY-SA 4.0')).toBe('https://was.test/img/wm/commons/a/ab/Pele_1970.jpg/1280');
    expect(ogImageUrl('https://was.test', PHOTO, 'Public domain')).toBe('https://was.test/img/wm/commons/a/ab/Pele_1970.jpg/1280');
  });

  it('falls back to the default card without a photo, without a free license or off Commons', () => {
    expect(ogImageUrl('https://was.test', undefined, null)).toBe('https://was.test/og/default.png');
    expect(ogImageUrl('https://was.test', PHOTO, null)).toBe('https://was.test/og/default.png');
    expect(ogImageUrl('https://was.test', PHOTO, 'CC BY-NC 2.0')).toBe('https://was.test/og/default.png');
    expect(ogImageUrl('https://was.test', 'https://lh3.googleusercontent.com/a/photo.jpg', 'CC0')).toBe('https://was.test/og/default.png');
  });
});
