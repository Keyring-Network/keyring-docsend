import { getAdminEmails } from "./allowlist";
import { getStore } from "./store";
import { createAccessDecisionToken, createMagicToken } from "./tokens";
import { selectTransport, sendAccessApproved, sendAccessRequest } from "./mailer";

export type RequestStatus = "already-approved" | "already-pending" | "sent";

function decideUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/api/access/decide?token=${encodeURIComponent(token)}`;
}

function magicVerifyUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/signin/verify?token=${encodeURIComponent(token)}`;
}

/**
 * Record an access request from an unapproved user and email every admin a
 * one-click approve / reject link. No-ops (without emailing) if they're
 * already a viewer or already pending.
 */
export async function ensureAccessRequest(input: {
  email: string;
  provider: string;
  baseUrl: string;
}): Promise<RequestStatus> {
  const email = input.email.toLowerCase();
  const store = getStore();
  const state = await store.read();
  if (state.viewers.includes(email)) return "already-approved";
  if (state.pending[email]) return "already-pending";

  await store.addPending({ email, provider: input.provider, requestedAt: Date.now() });

  const admins = [...getAdminEmails()];
  if (admins.length === 0) return "sent";

  const [approve, reject] = await Promise.all([
    createAccessDecisionToken({ subject: email, decision: "approve" }),
    createAccessDecisionToken({ subject: email, decision: "reject" }),
  ]);
  await sendAccessRequest(selectTransport(), {
    to: admins,
    requesterEmail: email,
    approveUrl: decideUrl(input.baseUrl, approve),
    rejectUrl: decideUrl(input.baseUrl, reject),
  });
  return "sent";
}

/**
 * Promote an email to viewer and notify them. Magic-link requesters get a
 * fresh sign-in link; OAuth requesters get a "sign in again" nudge. Returns
 * whether a notification was sent (false when there was no pending request).
 */
export async function performApproval(input: {
  email: string;
  actor: string | null;
  baseUrl: string;
}): Promise<{ notified: boolean }> {
  const email = input.email.toLowerCase();
  const store = getStore();
  const before = await store.read();
  const pending = before.pending[email];
  await store.addViewer(email, input.actor);
  if (!pending) return { notified: false };

  const transport = selectTransport();
  if (pending.provider === "magic-link") {
    const token = await createMagicToken(email);
    await sendAccessApproved(transport, {
      to: email,
      method: "magic-link",
      signInUrl: magicVerifyUrl(input.baseUrl, token),
    });
  } else {
    await sendAccessApproved(transport, {
      to: email,
      method: "oauth",
      signInUrl: `${input.baseUrl}/`,
    });
  }
  return { notified: true };
}
