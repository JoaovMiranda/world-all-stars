import { describe, expect, it } from 'vitest';

import { responsiveSource, wikimediaFile, wikimediaStep } from './image-src.helper';

const ORIGINAL = 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Pele_con_brasil_%28cropped%29.jpg';
const THUMB_960 = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/Pele_con_brasil_%28cropped%29.jpg/960px-Pele_con_brasil_%28cropped%29.jpg';

describe('Wikimedia responsive images', () => {
  it('reads the Commons file from an original or a thumbnail URL', () => {
    expect(wikimediaFile(ORIGINAL)?.original).toBe(ORIGINAL);
    expect(wikimediaFile(THUMB_960)?.original).toBe(ORIGINAL);
    expect(wikimediaFile(ORIGINAL)?.thumb(120)).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Pele_con_brasil_%28cropped%29.jpg/120px-Pele_con_brasil_%28cropped%29.jpg',
    );
  });

  it('renders SVG logos as PNG thumbnails and ignores other hosts', () => {
    expect(wikimediaFile('https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo_FIFA.svg')?.thumb(60)).toMatch(/\/60px-Logo_FIFA\.svg\.png$/);
    expect(wikimediaFile('https://lh3.googleusercontent.com/a/photo=s96')).toBeNull();
    expect(responsiveSource('https://lh3.googleusercontent.com/a/photo=s96', 32)).toEqual({ src: 'https://lh3.googleusercontent.com/a/photo=s96' });
  });

  it('picks pre-rendered steps: from 1x to 2x for fixed sizes (sizes = width), all steps for fluid cards', () => {
    expect(wikimediaStep(52)).toBe(60);
    expect(wikimediaStep(5000)).toBe(1280);
    const avatar = responsiveSource(THUMB_960, 52);
    expect(avatar.src).toMatch(/\/60px-/);
    expect(avatar.srcSet).toMatch(/\/60px-.+ 60w, .+\/120px-.+ 120w$/);
    expect(avatar.sizes).toBe('52px');
    // A 251px portrait offers 330, 500 and 960: a 1.75x phone (440px) gets 500, not 960.
    const portrait = responsiveSource(THUMB_960, 251);
    expect(portrait.srcSet?.split(', ').map((c) => c.split(' ')[1])).toEqual(['330w', '500w', '960w']);
    expect(avatar.fallback).toBe(ORIGINAL);
    const card = responsiveSource(ORIGINAL, 300, { sizes: '300px', maxWidth: 520 });
    expect(card.srcSet?.split(', ').map((c) => c.split(' ')[1])).toEqual(['60w', '120w', '250w', '330w', '500w', '960w']);
  });

  it('with the real API, thumbnails go through the same-origin proxy (the fallback stays the Commons original)', () => {
    const portrait = responsiveSource(THUMB_960, 251, undefined, 'proxy');
    expect(portrait.src).toBe('/img/wm/commons/5/5e/Pele_con_brasil_%28cropped%29.jpg/330');
    expect(portrait.srcSet).toContain('/img/wm/commons/5/5e/Pele_con_brasil_%28cropped%29.jpg/500 500w');
    expect(portrait.fallback).toBe(ORIGINAL);
  });
});
