// Licenses the site may show an image under (handoff §8, T4.4/T4.5): CC0, public domain, CC BY and CC BY-SA (any
// version or port). Non-commercial (NC), no-derivatives (ND), GFDL-only, fair use and unknown licenses are refused.
// Input is the short name Commons reports in `extmetadata.LicenseShortName` ("CC BY-SA 4.0", "Public domain", "CC0").

// Also the pt/es label older curated rows carry ("dominio publico" once accents are removed).
const PUBLIC_DOMAIN = /^(?:cc0(?:\s*1\.0)?|cc-zero|pd(?:[\s-].*)?|public\s+domain(?:\s+mark(?:\s+1\.0)?)?|dominio\s+publico)$/i;
const CC_BY = /^cc[\s-]by(?:[\s-]sa)?(?:[\s-]\d(?:\.\d)?(?:[\s-][a-z]{2,3})?)?$/i;

/** Normalized short name: no accents or markup, single spaces, no trailing "license". */
const normalize = (license: string): string =>
  license
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+licen[cs]e$/i, '')
    .trim();

/** Whether an image under this license may be shown (with attribution) on the site. */
export const isFreeLicense = (license: string | null | undefined): boolean => {
  if (!license) return false;
  const name = normalize(license);
  if (/\b(?:nc|nd)\b/i.test(name)) return false;
  return PUBLIC_DOMAIN.test(name) || CC_BY.test(name);
};
