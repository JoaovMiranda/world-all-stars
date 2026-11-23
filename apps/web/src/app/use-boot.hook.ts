import type { IsoDate } from '@was/shared';
import type { Boot } from './boot.interface';
import { getBoot } from './request-scope';

/** Boot of this page load (fixed for its lifetime, identical on server and client). */
export const useBoot = (): Boot => getBoot();

/** "Today" for rendering (APP_TIME_ZONE, decided by the server): never `new Date()` during render. */
export const useToday = (): IsoDate => getBoot().today;
