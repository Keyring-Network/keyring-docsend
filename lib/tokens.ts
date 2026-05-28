import { signJwt, verifyJwt } from "./jwt";

/**
 * The two signed tokens the app issues, each scoped to its own audience so a
 * token from one flow can't be replayed in the other.
 */
const MAGIC_AUDIENCE = "keyring-docsend/magic-link";
const DECISION_AUDIENCE = "keyring-docsend/access-decision";

export const MAGIC_LINK_TTL_MINUTES = 15;
const MAGIC_TTL_SECONDS = MAGIC_LINK_TTL_MINUTES * 60;
const DECISION_TTL_SECONDS = 7 * 24 * 60 * 60;

export type AccessDecision = "approve" | "reject";

export function createMagicToken(email: string): Promise<string> {
  return signJwt(
    { email: email.toLowerCase() },
    { audience: MAGIC_AUDIENCE, ttlSeconds: MAGIC_TTL_SECONDS },
  );
}

export async function verifyMagicToken(
  token: string | null | undefined,
): Promise<{ email: string } | null> {
  const payload = await verifyJwt(token, MAGIC_AUDIENCE);
  if (!payload || typeof payload.email !== "string") return null;
  return { email: payload.email };
}

export function createAccessDecisionToken(input: {
  subject: string;
  decision: AccessDecision;
}): Promise<string> {
  return signJwt(
    { sub: input.subject.toLowerCase(), decision: input.decision },
    { audience: DECISION_AUDIENCE, ttlSeconds: DECISION_TTL_SECONDS },
  );
}

function isDecision(value: unknown): value is AccessDecision {
  return value === "approve" || value === "reject";
}

export async function verifyAccessDecisionToken(
  token: string | null | undefined,
): Promise<{ subject: string; decision: AccessDecision } | null> {
  const payload = await verifyJwt(token, DECISION_AUDIENCE);
  if (!payload || typeof payload.sub !== "string" || !isDecision(payload.decision)) {
    return null;
  }
  return { subject: payload.sub, decision: payload.decision };
}
