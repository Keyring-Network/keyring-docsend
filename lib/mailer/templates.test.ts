import { describe, expect, it } from "vitest";
import {
  accessApprovedEmail,
  accessRequestEmail,
  escapeHtml,
  magicLinkEmail,
} from "./templates";

describe("escapeHtml", () => {
  it("escapes the dangerous characters", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });
});

describe("magicLinkEmail", () => {
  it("includes the url, site name and ttl", () => {
    const msg = magicLinkEmail({ siteName: "Docs", url: "https://x/y", ttlMinutes: 15 });
    expect(msg.subject).toBe("Sign in to Docs");
    expect(msg.text).toContain("https://x/y");
    expect(msg.text).toContain("15 minutes");
    expect(msg.html).toContain("https://x/y");
  });
});

describe("accessRequestEmail", () => {
  it("includes approve and reject urls and escapes the email", () => {
    const msg = accessRequestEmail({
      siteName: "Docs",
      requesterEmail: "a+b@x.com",
      approveUrl: "https://x/approve",
      rejectUrl: "https://x/reject",
    });
    expect(msg.subject).toContain("a+b@x.com");
    expect(msg.html).toContain("https://x/approve");
    expect(msg.html).toContain("https://x/reject");
  });
});

describe("accessApprovedEmail", () => {
  it("uses the magic-link copy + CTA", () => {
    const msg = accessApprovedEmail({
      siteName: "Docs",
      method: "magic-link",
      signInUrl: "https://x/verify",
    });
    expect(msg.text).toContain("open the document");
    expect(msg.html).toContain(">Open<");
  });

  it("uses the oauth copy + CTA", () => {
    const msg = accessApprovedEmail({
      siteName: "Docs",
      method: "oauth",
      signInUrl: "https://x/",
    });
    expect(msg.text).toContain("Sign in again");
    expect(msg.html).toContain(">Sign in<");
  });
});
