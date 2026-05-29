import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createAccessDecisionToken,
  createMagicToken,
  verifyAccessDecisionToken,
  verifyMagicToken,
} from "./tokens";
import { signJwt } from "./jwt";

beforeEach(() => {
  process.env.AUTH_SECRET = "test-secret-at-least-32-chars-long-xx";
});
afterEach(() => {
  delete process.env.AUTH_SECRET;
});

describe("magic token", () => {
  it("round-trips and lowercases the email", async () => {
    const token = await createMagicToken("Alice@x.com");
    expect(await verifyMagicToken(token)).toEqual({ email: "alice@x.com" });
  });

  it("rejects null / garbage / wrong-audience tokens", async () => {
    expect(await verifyMagicToken(null)).toBeNull();
    expect(await verifyMagicToken("garbage")).toBeNull();
    const wrongAud = await signJwt(
      { email: "a@x.com" },
      { audience: "other", ttlSeconds: 60 },
    );
    expect(await verifyMagicToken(wrongAud)).toBeNull();
  });

  it("rejects a token missing the email claim", async () => {
    const noEmail = await signJwt(
      {},
      { audience: "keyring-docsend/magic-link", ttlSeconds: 60 },
    );
    expect(await verifyMagicToken(noEmail)).toBeNull();
  });
});

describe("access-decision token", () => {
  it("round-trips subject + decision", async () => {
    const token = await createAccessDecisionToken({
      subject: "B@x.com",
      decision: "approve",
    });
    expect(await verifyAccessDecisionToken(token)).toEqual({
      subject: "b@x.com",
      decision: "approve",
    });
  });

  it("rejects an invalid decision claim", async () => {
    const bad = await signJwt(
      { sub: "a@x.com", decision: "maybe" },
      { audience: "keyring-docsend/access-decision", ttlSeconds: 60 },
    );
    expect(await verifyAccessDecisionToken(bad)).toBeNull();
  });

  it("rejects a token missing the subject", async () => {
    const bad = await signJwt(
      { decision: "approve" },
      { audience: "keyring-docsend/access-decision", ttlSeconds: 60 },
    );
    expect(await verifyAccessDecisionToken(bad)).toBeNull();
  });

  it("rejects null", async () => {
    expect(await verifyAccessDecisionToken(null)).toBeNull();
  });
});
