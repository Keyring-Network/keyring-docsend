/**
 * Small, shared environment + string helpers. Kept in one place so every
 * other module parses env the same way (and jscpd doesn't flag duplicated
 * parsing logic).
 */

/** Trimmed env value, or undefined if unset/blank. */
export function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Trimmed env value, or throws if unset/blank. */
export function requiredEnv(name: string): string {
  const value = optionalEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** True when every named env var is present and non-blank. */
export function hasEnv(...names: string[]): boolean {
  return names.every((name) => optionalEnv(name) !== undefined);
}

/**
 * Parse a list of emails from a single env value. Tolerates commas,
 * semicolons, whitespace, and surrounding quotes; lowercases and de-dupes.
 */
export function parseEmailList(value: string | undefined): string[] {
  if (!value) return [];
  const unquoted = value.replace(/^["']|["']$/g, "");
  const parts = unquoted
    .split(/[\s,;]+/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0);
  return [...new Set(parts)];
}

/** Redact an email for logs: keeps the first two chars and the domain. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * A pragmatic, ReDoS-safe email check (exactly one @, non-empty local, a
 * dotted domain, no whitespace). Not full RFC 5322 — just enough to reject
 * obvious non-emails before we try to send one.
 */
export function isLikelyEmail(value: string): boolean {
  if (/\s/.test(value)) return false;
  const at = value.indexOf("@");
  if (at <= 0 || at !== value.lastIndexOf("@")) return false;
  const domain = value.slice(at + 1);
  return domain.length > 2 && domain.includes(".") && !domain.endsWith(".");
}
