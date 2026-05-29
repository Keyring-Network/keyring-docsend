"use server";

import { headers } from "next/headers";
import { isApproved } from "@/lib/access";
import { ensureAccessRequest } from "@/lib/access-flow";
import { resolveBaseUrl } from "@/lib/base-url";
import { isLikelyEmail } from "@/lib/env";
import { selectTransport, sendMagicLink } from "@/lib/mailer";
import { createMagicToken, MAGIC_LINK_TTL_MINUTES } from "@/lib/tokens";

export type MagicLinkResult =
  | { ok: true; status: "sent" | "requested"; ttlMinutes: number }
  | { ok: false; error: string };

async function emailApprovedUser(email: string, baseUrl: string): Promise<void> {
  const token = await createMagicToken(email);
  const url = `${baseUrl}/signin/verify?token=${encodeURIComponent(token)}`;
  await sendMagicLink(selectTransport(), { to: email, url });
}

/** Sign-in form action. Approved users get a magic link; everyone else is
 *  routed into the access-request flow. The response is intentionally generic
 *  so it can't be used to probe who's on the allowlist. */
export async function requestMagicLink(
  _prev: MagicLinkResult | null,
  formData: FormData,
): Promise<MagicLinkResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!isLikelyEmail(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const baseUrl = resolveBaseUrl(await headers());
  const ttlMinutes = MAGIC_LINK_TTL_MINUTES;

  if (await isApproved(email)) {
    await emailApprovedUser(email, baseUrl);
    return { ok: true, status: "sent", ttlMinutes };
  }

  await ensureAccessRequest({ email, provider: "magic-link", baseUrl });
  return { ok: true, status: "requested", ttlMinutes };
}
