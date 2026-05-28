import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessState, PendingRequest } from "./store";

type Sent = { kind: string; opts: Record<string, unknown> };

const h = vi.hoisted(() => ({
  state: { viewers: [], pending: {}, audit: [] } as AccessState,
  admins: [] as string[],
  addViewer: vi.fn<(email: string, actor: string | null) => Promise<void>>(
    async () => {},
  ),
  addPending: vi.fn<(req: PendingRequest) => Promise<{ created: boolean }>>(async () => ({
    created: true,
  })),
  sent: [] as Sent[],
}));

vi.mock("./store", () => ({
  getStore: () => ({
    read: async () => h.state,
    addViewer: h.addViewer,
    addPending: h.addPending,
  }),
}));
vi.mock("./allowlist", () => ({ getAdminEmails: () => new Set(h.admins) }));
vi.mock("./tokens", () => ({
  createAccessDecisionToken: async (i: { decision: string }) => `tok-${i.decision}`,
  createMagicToken: async () => "magic-tok",
}));
vi.mock("./mailer", () => ({
  selectTransport: () => ({ send: async () => {} }),
  sendAccessRequest: async (_t: unknown, opts: Record<string, unknown>) => {
    h.sent.push({ kind: "request", opts });
  },
  sendAccessApproved: async (_t: unknown, opts: Record<string, unknown>) => {
    h.sent.push({ kind: "approved", opts });
  },
  sendMagicLink: async (_t: unknown, opts: Record<string, unknown>) => {
    h.sent.push({ kind: "magic", opts });
  },
}));

import { ensureAccessRequest, performApproval } from "./access-flow";

const pending = (email: string, provider: string): PendingRequest => ({
  email,
  provider,
  requestedAt: 0,
});

beforeEach(() => {
  h.state = { viewers: [], pending: {}, audit: [] };
  h.admins = [];
  h.sent = [];
});
afterEach(() => {
  vi.clearAllMocks();
});

describe("ensureAccessRequest", () => {
  const input = { email: "R@x.com", provider: "google", baseUrl: "https://x" };

  it("returns already-approved for a viewer", async () => {
    h.state.viewers = ["r@x.com"];
    expect(await ensureAccessRequest(input)).toBe("already-approved");
    expect(h.addPending).not.toHaveBeenCalled();
  });

  it("returns already-pending for a pending email", async () => {
    h.state.pending = { "r@x.com": pending("r@x.com", "google") };
    expect(await ensureAccessRequest(input)).toBe("already-pending");
  });

  it("records pending but skips email when there are no admins", async () => {
    expect(await ensureAccessRequest(input)).toBe("sent");
    expect(h.addPending).toHaveBeenCalledOnce();
    expect(h.sent).toHaveLength(0);
  });

  it("emails admins with approve + reject links", async () => {
    h.admins = ["admin@x.com"];
    expect(await ensureAccessRequest(input)).toBe("sent");
    expect(h.sent[0].kind).toBe("request");
    expect(String(h.sent[0].opts.approveUrl)).toContain("tok-approve");
    expect(String(h.sent[0].opts.rejectUrl)).toContain("tok-reject");
  });
});

describe("performApproval", () => {
  const input = { email: "R@x.com", actor: "admin@x.com", baseUrl: "https://x" };

  it("adds viewer but does not notify when not pending", async () => {
    const res = await performApproval(input);
    expect(h.addViewer).toHaveBeenCalledWith("r@x.com", "admin@x.com");
    expect(res).toEqual({ notified: false });
    expect(h.sent).toHaveLength(0);
  });

  it("emails a magic link for a magic-link requester", async () => {
    h.state.pending = { "r@x.com": pending("r@x.com", "magic-link") };
    const res = await performApproval(input);
    expect(res).toEqual({ notified: true });
    expect(h.sent[0].kind).toBe("approved");
    expect(h.sent[0].opts.method).toBe("magic-link");
    expect(String(h.sent[0].opts.signInUrl)).toContain("magic-tok");
  });

  it("emails a retry nudge for an oauth requester", async () => {
    h.state.pending = { "r@x.com": pending("r@x.com", "google") };
    await performApproval(input);
    expect(h.sent[0].opts.method).toBe("oauth");
  });
});
