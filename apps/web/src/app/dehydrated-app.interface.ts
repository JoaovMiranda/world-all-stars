import type { DehydratedState } from '@tanstack/react-query';
import type { Boot } from './boot.interface';

/** What travels from the server render to the browser with the router state (serialized by the router, seroval). */
export interface DehydratedApp {
  boot: Boot;
  queries: DehydratedState;
}
