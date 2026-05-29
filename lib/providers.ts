import { hasEnv, optionalEnv } from "./env";

/**
 * Which sign-in providers are available, derived purely from which env vars
 * are present. Both the sign-in UI (button list) and auth.ts (which NextAuth
 * providers to instantiate) read from here, so they can never disagree.
 */
export type SignInProvider = { id: string; label: string };

type OAuthSpec = { id: string; label: string; envKeys: string[] };

function oauthSpecs(): OAuthSpec[] {
  return [
    { id: "google", label: "Google", envKeys: ["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"] },
    { id: "github", label: "GitHub", envKeys: ["AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET"] },
    {
      id: "microsoft-entra-id",
      label: "Microsoft",
      envKeys: [
        "AUTH_MICROSOFT_ENTRA_ID_ID",
        "AUTH_MICROSOFT_ENTRA_ID_SECRET",
        "AUTH_MICROSOFT_ENTRA_ID_ISSUER",
      ],
    },
    {
      id: "oidc",
      label: optionalEnv("AUTH_OIDC_NAME") ?? "SSO",
      envKeys: ["AUTH_OIDC_ID", "AUTH_OIDC_SECRET", "AUTH_OIDC_ISSUER"],
    },
  ];
}

export function enabledOAuthProviders(): SignInProvider[] {
  return oauthSpecs()
    .filter((spec) => hasEnv(...spec.envKeys))
    .map((spec) => ({ id: spec.id, label: spec.label }));
}

/** OAuth providers that are configured, plus the always-on magic link. */
export function signInProviders(): SignInProvider[] {
  return [...enabledOAuthProviders(), { id: "magic-link", label: "Email magic link" }];
}
