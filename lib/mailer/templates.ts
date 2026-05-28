/**
 * Pure email builders. Each returns a transport-agnostic message. The shared
 * layout/button/escape helpers keep the HTML in one place (no duplication).
 */
export type EmailMessage = { subject: string; text: string; html: string };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0f0f10;color:#f6f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:40px 16px;"><div style="max-width:520px;margin:0 auto;background:rgba(255,255,255,0.03);border:1px solid rgba(246,244,239,0.12);border-radius:12px;padding:32px;">${bodyHtml}</div></body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#f6f4ef;color:#0f0f10;text-decoration:none;font-weight:600;">${escapeHtml(label)}</a>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:600;line-height:1.25;">${escapeHtml(text)}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="opacity:0.75;line-height:1.5;">${text}</p>`;
}

export function magicLinkEmail(input: {
  siteName: string;
  url: string;
  ttlMinutes: number;
}): EmailMessage {
  const title = `Sign in to ${input.siteName}`;
  const lead = `Click to sign in. This link is valid for ${input.ttlMinutes} minutes.`;
  const body = heading(title) + paragraph(lead) + `<p>${button(input.url, "Open")}</p>`;
  return {
    subject: title,
    text: `${lead}\n\n${input.url}\n\nIf you didn't request this, ignore this email.`,
    html: layout(body),
  };
}

export function accessRequestEmail(input: {
  siteName: string;
  requesterEmail: string;
  approveUrl: string;
  rejectUrl: string;
}): EmailMessage {
  const title = `${input.requesterEmail} wants access`;
  const lead = `${escapeHtml(input.requesterEmail)} requested access to ${escapeHtml(input.siteName)}. First admin to decide wins.`;
  const actions = `<p>${button(input.approveUrl, "Approve")}&nbsp;&nbsp;${button(input.rejectUrl, "Reject")}</p>`;
  return {
    subject: `Access request: ${input.requesterEmail}`,
    text: `${input.requesterEmail} requested access to ${input.siteName}.\n\nApprove: ${input.approveUrl}\nReject: ${input.rejectUrl}`,
    html: layout(heading(title) + paragraph(lead) + actions),
  };
}

export function accessApprovedEmail(input: {
  siteName: string;
  method: "magic-link" | "oauth";
  signInUrl: string;
}): EmailMessage {
  const isMagic = input.method === "magic-link";
  const lead = isMagic
    ? "You've been approved. Click below to open the document."
    : "You've been approved. Sign in again with the account you used.";
  const cta = isMagic ? "Open" : "Sign in";
  const body =
    heading("You're approved") +
    paragraph(lead) +
    `<p>${button(input.signInUrl, cta)}</p>`;
  return {
    subject: `You're approved — ${input.siteName}`,
    text: `${lead}\n\n${input.signInUrl}`,
    html: layout(body),
  };
}
