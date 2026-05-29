import { parseEmailList } from "./env";

/**
 * Admins are defined by the ADMIN_EMAILS env var (comma/space/semicolon
 * separated). They can view, approve and reject access requests, and revoke
 * viewers. There is deliberately no hard-coded fallback admin — set at least
 * one email in ADMIN_EMAILS before deploying or no one can administer.
 */
export function getAdminEmails(): Set<string> {
  return new Set(parseEmailList(process.env.ADMIN_EMAILS));
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().has(email.toLowerCase());
}
