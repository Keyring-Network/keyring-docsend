import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { requiredEnv } from "./env";

/**
 * Stateless JWT core, signed with AUTH_SECRET. Magic-link and
 * access-decision tokens are thin wrappers over this (see tokens.ts), so the
 * jose boilerplate lives in exactly one place.
 */
const ISSUER = "keyring-docsend";

function signingKey(): Uint8Array {
  return new TextEncoder().encode(requiredEnv("AUTH_SECRET"));
}

export async function signJwt(
  claims: JWTPayload,
  opts: { audience: string; ttlSeconds: number },
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(opts.audience)
    .setIssuedAt()
    .setExpirationTime(`${opts.ttlSeconds}s`)
    .setJti(crypto.randomUUID())
    .sign(signingKey());
}

/** Verify a token for the given audience. Returns null on any failure. */
export async function verifyJwt(
  token: string | null | undefined,
  audience: string,
): Promise<JWTPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      issuer: ISSUER,
      audience,
    });
    return payload;
  } catch {
    return null;
  }
}
