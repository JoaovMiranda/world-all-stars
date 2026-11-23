/** True while rendering on the server (and in node tests): there is no DOM. */
export const IS_SERVER = typeof document === 'undefined';
