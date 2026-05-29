import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  hasEnv,
  isLikelyEmail,
  maskEmail,
  optionalEnv,
  parseEmailList,
  requiredEnv,
} from "./env";

const KEY = "KEYRING_DOCSEND_TEST_VAR";
const KEY2 = "KEYRING_DOCSEND_TEST_VAR_2";

describe("optionalEnv", () => {
  beforeEach(() => {
    delete process.env[KEY];
  });
  afterEach(() => {
    delete process.env[KEY];
  });

  it("returns undefined when unset", () => {
    expect(optionalEnv(KEY)).toBeUndefined();
  });

  it("returns undefined when blank/whitespace", () => {
    process.env[KEY] = "   ";
    expect(optionalEnv(KEY)).toBeUndefined();
  });

  it("returns the trimmed value when set", () => {
    process.env[KEY] = "  hello  ";
    expect(optionalEnv(KEY)).toBe("hello");
  });
});

describe("requiredEnv", () => {
  afterEach(() => {
    delete process.env[KEY];
  });

  it("returns the value when present", () => {
    process.env[KEY] = "value";
    expect(requiredEnv(KEY)).toBe("value");
  });

  it("throws when missing", () => {
    delete process.env[KEY];
    expect(() => requiredEnv(KEY)).toThrow(/Missing required environment variable/);
  });
});

describe("hasEnv", () => {
  afterEach(() => {
    delete process.env[KEY];
    delete process.env[KEY2];
  });

  it("is true only when all are present", () => {
    process.env[KEY] = "a";
    process.env[KEY2] = "b";
    expect(hasEnv(KEY, KEY2)).toBe(true);
  });

  it("is false when any is missing", () => {
    process.env[KEY] = "a";
    expect(hasEnv(KEY, KEY2)).toBe(false);
  });
});

describe("parseEmailList", () => {
  it("returns [] for undefined", () => {
    expect(parseEmailList(undefined)).toEqual([]);
  });

  it("splits on commas, semicolons and whitespace", () => {
    expect(parseEmailList("a@x.com, b@x.com; c@x.com d@x.com")).toEqual([
      "a@x.com",
      "b@x.com",
      "c@x.com",
      "d@x.com",
    ]);
  });

  it("strips surrounding quotes, lowercases, de-dupes", () => {
    expect(parseEmailList('"A@x.com,A@x.com,B@x.com"')).toEqual(["a@x.com", "b@x.com"]);
  });
});

describe("maskEmail", () => {
  it("masks a normal email", () => {
    expect(maskEmail("callum@example.com")).toBe("ca***@example.com");
  });

  it("returns *** for a malformed value", () => {
    expect(maskEmail("not-an-email")).toBe("***");
  });
});

describe("isLikelyEmail", () => {
  it("accepts a normal email", () => {
    expect(isLikelyEmail("a@example.com")).toBe(true);
  });

  it("rejects whitespace, missing/duplicate @, and bad domains", () => {
    expect(isLikelyEmail("a b@example.com")).toBe(false);
    expect(isLikelyEmail("@example.com")).toBe(false);
    expect(isLikelyEmail("a@b@example.com")).toBe(false);
    expect(isLikelyEmail("a@localhost")).toBe(false);
    expect(isLikelyEmail("a@example.")).toBe(false);
  });
});
