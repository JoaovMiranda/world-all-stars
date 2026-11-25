/** Adult Jiu-Jitsu belts (IBJJF order). Slugs of the `belt` dimension. */
export const BjjBelt = {
  White: 'white',
  Blue: 'blue',
  Purple: 'purple',
  Brown: 'brown',
  Black: 'black',
} as const;
export type BjjBelt = (typeof BjjBelt)[keyof typeof BjjBelt];
export const BJJ_BELT_VALUES = Object.values(BjjBelt) as [BjjBelt, ...BjjBelt[]];
