/**
 * generateCertId — creates a human-readable, unique certificate ID.
 * Format: NCCT-CERT-{YEAR}-{INST_TYPE}-{4-digit-random}
 * Example: NCCT-CERT-2026-VAM-4821
 */
export const generateCertId = (instType: string): string => {
  const year = new Date().getFullYear();
  const tag = instType.replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `NCCT-CERT-${year}-${tag}-${rand}`;
};

/**
 * generateCertHash — creates a deterministic hex hash for the certificate.
 * In production this would be a real cryptographic signature.
 */
export const generateCertHash = (): string =>
  '0x' + Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
