import { siteConfig } from "../../siteConfig";
import { MAGIC_LINK_TTL_MINUTES } from "../tokens";
import { accessApprovedEmail, accessRequestEmail, magicLinkEmail } from "./templates";
import type { Transport } from "./transport";

/**
 * High-level sends: compose a template with the chosen transport. The
 * transport is passed in (resolved by callers via selectTransport) so these
 * stay pure and trivially testable.
 */
export function sendMagicLink(
  transport: Transport,
  opts: { to: string; url: string },
): Promise<void> {
  return transport.send({
    to: opts.to,
    ...magicLinkEmail({
      siteName: siteConfig.siteName,
      url: opts.url,
      ttlMinutes: MAGIC_LINK_TTL_MINUTES,
    }),
  });
}

export function sendAccessRequest(
  transport: Transport,
  opts: { to: string[]; requesterEmail: string; approveUrl: string; rejectUrl: string },
): Promise<void> {
  return transport.send({
    to: opts.to,
    ...accessRequestEmail({
      siteName: siteConfig.siteName,
      requesterEmail: opts.requesterEmail,
      approveUrl: opts.approveUrl,
      rejectUrl: opts.rejectUrl,
    }),
  });
}

export function sendAccessApproved(
  transport: Transport,
  opts: { to: string; method: "magic-link" | "oauth"; signInUrl: string },
): Promise<void> {
  return transport.send({
    to: opts.to,
    ...accessApprovedEmail({
      siteName: siteConfig.siteName,
      method: opts.method,
      signInUrl: opts.signInUrl,
    }),
  });
}
