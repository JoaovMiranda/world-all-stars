/** Joins truthy class names (`cx('btn', active && 'on')`). */
export const cx = (...parts: Array<string | false | null | undefined>): string => parts.filter(Boolean).join(' ');
