import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signJwt, verifyJwt } from "./jwt";

beforeEach(() => {
  process.env.AUTH_SECRET = "test-secret-at-least-32-chars-long-xx";
});
afterEach(() => {
  delete process.env.AUTH_SECRET;
});

describe("signJwt / verifyJwt", () => {
  it("round-trips claims for the right audience", async () => {
    const token = await signJwt({ foo: "bar" }, { audience: "aud", ttlSeconds: 60 });
    const payload = await verifyJwt(token, "aud");
    expect(payload?.foo).toBe("bar");
  });

  it("returns null for the wrong audience", async () => {
    const token = await signJwt({}, { audience: "aud", ttlSeconds: 60 });
    expect(await verifyJwt(token, "other")).toBeNull();
  });

  it("returns null for null/garbage", async () => {
    expect(await verifyJwt(null, "aud")).toBeNull();
    expect(await verifyJwt("garbage", "aud")).toBeNull();
  });

  it("throws when AUTH_SECRET is missing", async () => {
    delete process.env.AUTH_SECRET;
    await expect(signJwt({}, { audience: "aud", ttlSeconds: 60 })).rejects.toThrow(
      /AUTH_SECRET/,
    );
  });
});
