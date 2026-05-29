import { afterEach, describe, expect, it } from "vitest";
import { enabledOAuthProviders, signInProviders } from "./providers";

const VARS = [
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET",
  "AUTH_MICROSOFT_ENTRA_ID_ID",
  "AUTH_MICROSOFT_ENTRA_ID_SECRET",
  "AUTH_MICROSOFT_ENTRA_ID_ISSUER",
  "AUTH_OIDC_ID",
  "AUTH_OIDC_SECRET",
  "AUTH_OIDC_ISSUER",
  "AUTH_OIDC_NAME",
];

afterEach(() => {
  for (const v of VARS) delete process.env[v];
});

describe("enabledOAuthProviders", () => {
  it("is empty with no provider env set", () => {
    expect(enabledOAuthProviders()).toEqual([]);
  });

  it("enables a provider only when all its keys are present", () => {
    process.env.AUTH_GOOGLE_ID = "id";
    expect(enabledOAuthProviders()).toEqual([]);
    process.env.AUTH_GOOGLE_SECRET = "secret";
    expect(enabledOAuthProviders()).toEqual([{ id: "google", label: "Google" }]);
  });

  it("labels OIDC from AUTH_OIDC_NAME when set", () => {
    process.env.AUTH_OIDC_ID = "id";
    process.env.AUTH_OIDC_SECRET = "secret";
    process.env.AUTH_OIDC_ISSUER = "https://issuer";
    process.env.AUTH_OIDC_NAME = "Okta";
    expect(enabledOAuthProviders()).toEqual([{ id: "oidc", label: "Okta" }]);
  });
});

describe("signInProviders", () => {
  it("always includes magic link last", () => {
    expect(signInProviders()).toEqual([{ id: "magic-link", label: "Email magic link" }]);
  });

  it("lists configured OAuth providers before magic link", () => {
    process.env.AUTH_GITHUB_ID = "id";
    process.env.AUTH_GITHUB_SECRET = "secret";
    expect(signInProviders()).toEqual([
      { id: "github", label: "GitHub" },
      { id: "magic-link", label: "Email magic link" },
    ]);
  });
});
