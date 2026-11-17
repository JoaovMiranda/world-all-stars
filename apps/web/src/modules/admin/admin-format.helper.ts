import { instantFormat } from '@/shared-ui/format.helper';

const percentFmt = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

/** `04/11/2026 14:30` from an ISO datetime (APP_TIME_ZONE). */
export const formatDateTime = (iso: string): string => instantFormat({ dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
/** `4 de nov. de 2026` from an ISO datetime (APP_TIME_ZONE). */
export const formatDay = (iso: string): string => instantFormat({ dateStyle: 'medium' }).format(new Date(iso));
/** `62%` from a 0–1 share. */
export const formatPercent = (share: number): string => percentFmt.format(share);
