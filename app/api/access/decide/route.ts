import { type NextRequest, NextResponse } from "next/server";
import { performApproval } from "@/lib/access-flow";
import { resolveBaseUrl } from "@/lib/base-url";
import { getStore } from "@/lib/store";
import { verifyAccessDecisionToken } from "@/lib/tokens";
import { siteConfig } from "@/siteConfig";

function page(title: string, body: string): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>${title} — ${siteConfig.siteName}</title><meta name="robots" content="noindex"/></head><body style="margin:0;background:#0f0f10;color:#f6f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;"><div style="max-width:440px;border:1px solid rgba(246,244,239,0.12);border-radius:12px;padding:32px;"><h1 style="margin:0 0 12px;font-size:22px;">${title}</h1><p style="margin:0;opacity:0.75;line-height:1.5;">${body}</p></div></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const verified = await verifyAccessDecisionToken(req.nextUrl.searchParams.get("token"));
  if (!verified) {
    return page("Invalid or expired link", "Ask the requester to try again.");
  }

  if (verified.decision === "reject") {
    await getStore().rejectPending(verified.subject, null);
    return page("Request rejected", `${verified.subject} was not granted access.`);
  }

  const { notified } = await performApproval({
    email: verified.subject,
    actor: null,
    baseUrl: resolveBaseUrl(req.headers),
  });
  const note = notified ? " They've been emailed a sign-in link." : "";
  return page("Approved", `${verified.subject} can now view the document.${note}`);
}
