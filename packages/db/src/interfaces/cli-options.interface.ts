/** Construction options of a `BaseCli` (defaults: real process arguments and environment, migrations applied). */
export interface CliOptions {
  /** Arguments after the script name (default `process.argv.slice(2)`). */
  argv?: readonly string[];
  /** Environment used for the database options (default `process.env`). */
  env?: NodeJS.ProcessEnv;
  /** Apply pending migrations before `run()` (default true). */
  migrate?: boolean;
  /** Output sink (default `console.log`). */
  log?: (message: string) => void;
}
