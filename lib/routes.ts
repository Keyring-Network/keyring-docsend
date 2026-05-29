/**
 * Route classification used by the proxy/middleware gate. Pure so the gating
 * rules are unit-tested; the middleware itself is thin glue around this.
 */
export type RouteClass = "public" | "admin" | "protected";

const PUBLIC_EXACT = new Set(["/", "/signin/verify"]);
const PUBLIC_PREFIXES = ["/api/access/decide"];
const ADMIN_PREFIX = "/admin";

export function classifyRoute(pathname: string): RouteClass {
  if (PUBLIC_EXACT.has(pathname)) return "public";
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return "public";
  if (pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)) {
    return "admin";
  }
  return "protected";
}
