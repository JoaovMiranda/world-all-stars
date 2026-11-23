import type { WikimediaStep } from '../types/wikimedia-step.type';

export interface CommonsFileRef {
  project: string;
  a: string;
  ab: string;
  /** Decoded file name (`Pele_con_brasil_(cropped).jpg`). */
  file: string;
}

export interface WikimediaFile extends CommonsFileRef {
  original: string;
  /** Direct Commons thumbnail URL. */
  thumb(width: number): string;
  /** Same thumbnail through the same-origin proxy (`/img/wm/commons/5/5e/<file>/500`). */
  proxied(width: WikimediaStep): string;
}
