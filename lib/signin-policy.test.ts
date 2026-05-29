import { describe, expect, it, vi } from "vitest";
import { decideSignIn, type SignInPolicyInput } from "./signin-policy";

function input(over: Partial<SignInPolicyInput>): SignInPolicyInput {
  return {
    email: "a@x.com",
    provider: "google",
    emailVerified: undefined,
    baseUrl: "https://x",
    isApproved: async () => false,
    requestAccess: vi.fn(async () => {}),
    ...over,
  };
}

describe("decideSignIn", () => {
  it("denies when there is no email", async () => {
    expect(await decideSignIn(input({ email: null }))).toBe(false);
  });

  it("denies an explicitly unverified email", async () => {
    expect(await decideSignIn(input({ emailVerified: false }))).toBe(false);
  });

  it("allows an approved user", async () => {
    expect(await decideSignIn(input({ isApproved: async () => true }))).toBe(true);
  });

  it("denies an unapproved magic-link sign-in without re-requesting", async () => {
    const requestAccess = vi.fn(async () => {});
    expect(await decideSignIn(input({ provider: "magic-link", requestAccess }))).toBe(
      false,
    );
    expect(requestAccess).not.toHaveBeenCalled();
  });

  it("records a request and redirects for an unapproved OAuth sign-in", async () => {
    const requestAccess = vi.fn(async () => {});
    const result = await decideSignIn(input({ requestAccess }));
    expect(result).toBe("/?status=request-sent");
    expect(requestAccess).toHaveBeenCalledWith({
      email: "a@x.com",
      provider: "google",
      baseUrl: "https://x",
    });
  });
});
