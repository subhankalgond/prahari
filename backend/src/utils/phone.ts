// Indian mobile numbers are stored with the +91 country code. Login should
// accept whatever the farmer types: 10 digits, with 91 prefix, or with +.

export function normalizeMobile(mobile: string): string {
  const trimmed = mobile.trim();
  if (trimmed.includes('@')) return trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return trimmed.startsWith('+') ? trimmed : `+${digits}`;
}

export function mobileVariants(identifier: string): string[] {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) return [trimmed.toLowerCase()];
  const digits = trimmed.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return [...new Set([trimmed, `+91${last10}`, `+${digits}`, digits].filter((v) => v.length >= 10))];
}
