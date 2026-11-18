import { FORBIDDEN_SOURCE_HOSTS } from '../consts/source-url.const';
import { DEFAULT_LOCALE, type Locale } from '../i18n/locale.const';
import { textFor } from '../i18n/messages.helper';
import { VALIDATION_MESSAGES } from '../consts/validation-messages.const';
import { SourceUsageStatus } from '../enums/source-usage-status.enum';
import type { SourceDomainRule } from '../types/source-rule.type';

export type SourceUrlError = 'invalid_url' | 'not_https' | 'forbidden_host' | 'rejected_source';

export type SourceUrlCheck =
  | { ok: true; url: string; source: { name: string; usageStatus: SourceUsageStatus } | null; note: string | null }
  | { ok: false; error: SourceUrlError; message: string };

const IPV4_REGEX = /^\d{1,3}(\.\d{1,3}){3}$/;
const LOCAL_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.home.arpa'];

const bareHost = (hostname: string): string => hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');

/** Anti-SSRF (doc 05/21): no localhost, no IPv4/IPv6 literal, no dotless or local-only host, no credentials. */
export const isForbiddenSourceHost = (url: URL): boolean => {
  const host = url.hostname.toLowerCase();
  return (
    (FORBIDDEN_SOURCE_HOSTS as readonly string[]).includes(host) ||
    IPV4_REGEX.test(host) ||
    host.startsWith('[') ||
    host.includes(':') ||
    !host.includes('.') ||
    LOCAL_SUFFIXES.some((s) => host.endsWith(s)) ||
    url.username !== '' ||
    url.password !== ''
  );
};

/** Registry entry whose domain (or a subdomain of it) serves the URL. */
export const findSourceForUrl = (url: URL, sources: readonly SourceDomainRule[]): SourceDomainRule | undefined => {
  const host = bareHost(url.hostname);
  return sources.find((s) => {
    try {
      const base = bareHost(new URL(s.baseUrl).hostname);
      return host === base || host.endsWith(`.${base}`);
    } catch {
      return false;
    }
  });
};

/**
 * Validates a suggested source link (doc 21): valid URL, https, anti-SSRF host rules, rejected sources refused,
 * link-only sources accepted with a note. Same code on the server (before any crawl) and in the form.
 */
export const checkSourceUrl = (raw: unknown, sources: readonly SourceDomainRule[], locale: Locale = DEFAULT_LOCALE): SourceUrlCheck => {
  const m = textFor(VALIDATION_MESSAGES, locale);
  let url: URL;
  try {
    url = new URL(String(raw ?? '').trim());
  } catch {
    return { ok: false, error: 'invalid_url', message: m.urlInvalid };
  }
  if (url.protocol !== 'https:') return { ok: false, error: 'not_https', message: m.urlNotHttps };
  if (isForbiddenSourceHost(url)) return { ok: false, error: 'forbidden_host', message: m.urlForbiddenHost };
  const source = findSourceForUrl(url, sources);
  if (source?.usageStatus === SourceUsageStatus.Rejected) {
    return { ok: false, error: 'rejected_source', message: m.urlRejectedSource(source.name) };
  }
  return {
    ok: true,
    url: url.href,
    source: source ? { name: source.name, usageStatus: source.usageStatus } : null,
    note: source?.usageStatus === SourceUsageStatus.LinkOnly ? m.noteLinkOnly(source.name) : null,
  };
};
