import { afterEach, describe, expect, it } from "vitest";
import { getAdminEmails, isAdminEmail } from "./allowlist";

afterEach(() => {
  delete process.env.ADMIN_EMAILS;
});

describe("getAdminEmails", () => {
  it("is empty when ADMIN_EMAILS is unset", () => {
    delete process.env.ADMIN_EMAILS;
    expect(getAdminEmails().size).toBe(0);
  });

  it("parses the configured admins", () => {
    process.env.ADMIN_EMAILS = "Alice@x.com, bob@x.com";
    expect([...getAdminEmails()]).toEqual(["alice@x.com", "bob@x.com"]);
  });
});

describe("isAdminEmail", () => {
  it("returns false for null/undefined/empty", () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
    expect(isAdminEmail("")).toBe(false);
  });

  it("matches case-insensitively", () => {
    process.env.ADMIN_EMAILS = "alice@x.com";
    expect(isAdminEmail("ALICE@x.com")).toBe(true);
  });

  it("returns false for a non-admin", () => {
    process.env.ADMIN_EMAILS = "alice@x.com";
    expect(isAdminEmail("eve@x.com")).toBe(false);
  });
});
