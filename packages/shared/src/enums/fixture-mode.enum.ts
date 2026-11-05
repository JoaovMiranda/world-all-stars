/** Dev data mode of the web app while the API does not exist (?fixture=). */
export const FixtureMode = {
  Sample: 'sample',
  Empty: 'empty',
  Loading: 'loading',
  Error: 'error',
} as const;
export type FixtureMode = (typeof FixtureMode)[keyof typeof FixtureMode];
export const FIXTURE_MODE_VALUES = Object.values(FixtureMode) as [FixtureMode, ...FixtureMode[]];
