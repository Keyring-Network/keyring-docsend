import { optionalEnv } from "./env";

/**
 * Canonical base URL for outbound links (magic-link + approval emails).
 *
 * Deployment-specific URLs (e.g. a Vercel preview hash) are immutable and go
 * stale the moment you redeploy, which silently breaks links already sent in
 * emails. So we prefer stable sources, in order:
 *   1. AUTH_URL / NEXTAUTH_URL  (explicit override — set this in production)
 *   2. VERCEL_PROJECT_PRODUCTION_URL  (stable prod URL)
 *   3. VERCEL_BRANCH_URL  (stable for a preview branch's lifetime)
 *   4. the request's forwarded host  (last resort)
 */
export type HeaderReader = { get(name: string): string | null };

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function vercelUrl(): string | undefined {
  const env = optionalEnv("VERCEL_ENV");
  if (env === "production" && optionalEnv("VERCEL_PROJECT_PRODUCTION_URL")) {
    return `https://${optionalEnv("VERCEL_PROJECT_PRODUCTION_URL")}`;
  }
  if (env === "preview" && optionalEnv("VERCEL_BRANCH_URL")) {
    return `https://${optionalEnv("VERCEL_BRANCH_URL")}`;
  }
  return undefined;
}

export function resolveBaseUrl(headers: HeaderReader): string {
  const explicit = optionalEnv("AUTH_URL") ?? optionalEnv("NEXTAUTH_URL");
  if (explicit) return stripTrailingSlash(explicit);

  const fromVercel = vercelUrl();
  if (fromVercel) return fromVercel;

  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) throw new Error("Cannot determine base URL from request headers");
  const proto = headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
