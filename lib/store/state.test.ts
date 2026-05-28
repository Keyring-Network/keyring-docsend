import { describe, expect, it } from "vitest";
import {
  EMPTY_STATE,
  applyAddPending,
  applyAddViewer,
  applyRejectPending,
  applyRemoveViewer,
  normalizeState,
  type AccessState,
} from "./state";

const base = (over: Partial<AccessState> = {}): AccessState => ({
  viewers: [],
  pending: {},
  audit: [],
  ...over,
});

describe("normalizeState", () => {
  it("returns empty for non-objects", () => {
    expect(normalizeState(null)).toEqual(EMPTY_STATE);
    expect(normalizeState([])).toEqual(EMPTY_STATE);
    expect(normalizeState("nope")).toEqual(EMPTY_STATE);
  });

  it("defaults missing/mistyped keys", () => {
    expect(normalizeState({ viewers: "x", pending: 1, audit: 2 })).toEqual(EMPTY_STATE);
  });

  it("passes through valid shapes", () => {
    const state = base({ viewers: ["a@x.com"] });
    expect(normalizeState(state)).toEqual(state);
  });
});

describe("applyAddViewer", () => {
  it("adds, lowercases, clears pending, audits", () => {
    const start = base({ pending: { "a@x.com": pending("a@x.com") } });
    const next = applyAddViewer(start, "A@x.com", "admin@x.com", 100);
    expect(next.viewers).toEqual(["a@x.com"]);
    expect(next.pending).toEqual({});
    expect(next.audit).toEqual([
      { ts: 100, action: "approve", subject: "a@x.com", actor: "admin@x.com" },
    ]);
  });

  it("does not duplicate an existing viewer", () => {
    const next = applyAddViewer(base({ viewers: ["a@x.com"] }), "a@x.com", null, 1);
    expect(next.viewers).toEqual(["a@x.com"]);
  });
});

describe("applyRemoveViewer", () => {
  it("removes and audits", () => {
    const next = applyRemoveViewer(base({ viewers: ["a@x.com"] }), "A@x.com", "ad", 5);
    expect(next.viewers).toEqual([]);
    expect(next.audit[0]).toMatchObject({ action: "revoke", subject: "a@x.com" });
  });
});

describe("applyAddPending", () => {
  it("creates a pending entry", () => {
    const res = applyAddPending(base(), pending("A@x.com"), 7);
    expect(res.created).toBe(true);
    expect(res.state.pending["a@x.com"]).toMatchObject({ email: "a@x.com" });
  });

  it("no-ops when already a viewer", () => {
    const res = applyAddPending(base({ viewers: ["a@x.com"] }), pending("a@x.com"), 7);
    expect(res.created).toBe(false);
  });

  it("no-ops when already pending", () => {
    const start = base({ pending: { "a@x.com": pending("a@x.com") } });
    expect(applyAddPending(start, pending("a@x.com"), 7).created).toBe(false);
  });
});

describe("applyRejectPending", () => {
  it("removes a pending entry and audits", () => {
    const start = base({ pending: { "a@x.com": pending("a@x.com") } });
    const next = applyRejectPending(start, "A@x.com", "ad", 9);
    expect(next.pending).toEqual({});
    expect(next.audit[0]).toMatchObject({ action: "reject" });
  });

  it("no-ops when not pending", () => {
    const start = base();
    expect(applyRejectPending(start, "a@x.com", null, 9)).toBe(start);
  });
});

describe("audit trimming", () => {
  it("caps the audit log at 500 entries", () => {
    const audit = Array.from({ length: 500 }, (_, i) => ({
      ts: i,
      action: "request" as const,
      subject: `u${i}@x.com`,
      actor: null,
    }));
    const next = applyAddViewer(base({ audit }), "new@x.com", null, 999);
    expect(next.audit).toHaveLength(500);
    expect(next.audit.at(-1)).toMatchObject({ subject: "new@x.com" });
    expect(next.audit[0]).toMatchObject({ subject: "u1@x.com" });
  });
});

function pending(email: string): {
  email: string;
  provider: string;
  requestedAt: number;
} {
  return { email, provider: "magic-link", requestedAt: 0 };
}
