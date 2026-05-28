import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessState } from "./store";

const mock = vi.hoisted(() => ({
  state: { viewers: [], pending: {}, audit: [] } as AccessState,
}));

vi.mock("./store", () => ({
  getStore: () => ({ read: async () => mock.state }),
}));

import { isApproved, snapshot, isAdmin } from "./access";

beforeEach(() => {
  mock.state = { viewers: [], pending: {}, audit: [] };
  delete process.env.ADMIN_EMAILS;
});
afterEach(() => {
  delete process.env.ADMIN_EMAILS;
});

describe("isApproved", () => {
  it("is false for empty input", async () => {
    expect(await isApproved(null)).toBe(false);
  });

  it("is true for an admin without hitting viewers", async () => {
    process.env.ADMIN_EMAILS = "admin@x.com";
    expect(await isApproved("Admin@x.com")).toBe(true);
  });

  it("is true for a stored viewer", async () => {
    mock.state.viewers = ["v@x.com"];
    expect(await isApproved("V@x.com")).toBe(true);
  });

  it("is false for an unknown email", async () => {
    expect(await isApproved("nobody@x.com")).toBe(false);
  });
});

describe("isAdmin re-export", () => {
  it("matches admin emails", () => {
    process.env.ADMIN_EMAILS = "admin@x.com";
    expect(isAdmin("admin@x.com")).toBe(true);
  });
});

describe("snapshot", () => {
  it("merges env admins with stored state", async () => {
    process.env.ADMIN_EMAILS = "admin@x.com";
    mock.state.viewers = ["v@x.com"];
    const snap = await snapshot();
    expect(snap.admins).toEqual(["admin@x.com"]);
    expect(snap.viewers).toEqual(["v@x.com"]);
  });
});
