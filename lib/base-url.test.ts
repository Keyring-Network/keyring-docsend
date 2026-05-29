import { afterEach, describe, expect, it } from "vitest";
import { resolveBaseUrl } from "./base-url";

const VARS = [
  "AUTH_URL",
  "NEXTAUTH_URL",
  "VERCEL_ENV",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_BRANCH_URL",
];

afterEach(() => {
  for (const v of VARS) delete process.env[v];
});

function headers(map: Record<string, string>): { get(name: string): string | null } {
  return { get: (name) => map[name] ?? null };
}

describe("resolveBaseUrl", () => {
  it("prefers AUTH_URL and strips a trailing slash", () => {
    process.env.AUTH_URL = "https://docs.example.com/";
    expect(resolveBaseUrl(headers({}))).toBe("https://docs.example.com");
  });

  it("falls back to NEXTAUTH_URL", () => {
    process.env.NEXTAUTH_URL = "https://nx.example.com";
    expect(resolveBaseUrl(headers({}))).toBe("https://nx.example.com");
  });

  it("uses the Vercel production URL", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "prod.vercel.app";
    expect(resolveBaseUrl(headers({}))).toBe("https://prod.vercel.app");
  });

  it("uses the Vercel branch URL on previews", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_BRANCH_URL = "branch.vercel.app";
    expect(resolveBaseUrl(headers({}))).toBe("https://branch.vercel.app");
  });

  it("ignores Vercel vars when env/url are mismatched", () => {
    process.env.VERCEL_ENV = "production";
    expect(resolveBaseUrl(headers({ host: "h.example.com" }))).toBe(
      "https://h.example.com",
    );
  });

  it("uses forwarded host + proto last", () => {
    expect(
      resolveBaseUrl(
        headers({ "x-forwarded-host": "fwd.example.com", "x-forwarded-proto": "http" }),
      ),
    ).toBe("http://fwd.example.com");
  });

  it("defaults proto to https when only host is present", () => {
    expect(resolveBaseUrl(headers({ host: "h.example.com" }))).toBe(
      "https://h.example.com",
    );
  });

  it("throws when no host can be determined", () => {
    expect(() => resolveBaseUrl(headers({}))).toThrow(/Cannot determine base URL/);
  });
});
