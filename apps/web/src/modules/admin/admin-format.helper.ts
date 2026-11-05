const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });
const percentFmt = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

/** `04/11/2026 14:30` from an ISO datetime. */
export const formatDateTime = (iso: string): string => dateTimeFmt.format(new Date(iso));
/** `4 de nov. de 2026` from an ISO datetime. */
export const formatDay = (iso: string): string => dateFmt.format(new Date(iso));
/** `62%` from a 0–1 share. */
export const formatPercent = (share: number): string => percentFmt.format(share);
