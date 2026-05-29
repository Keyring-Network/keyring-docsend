import { headers } from "next/headers";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { authConfig } from "@/auth.config";
import { isApproved } from "@/lib/access";
import { ensureAccessRequest } from "@/lib/access-flow";
import { resolveBaseUrl } from "@/lib/base-url";
import { hasEnv, optionalEnv, requiredEnv } from "@/lib/env";
import { decideSignIn } from "@/lib/signin-policy";
import { verifyMagicToken } from "@/lib/tokens";

type Provider = NonNullable<NextAuthConfig["providers"]>[number];

function oauthProviders(): Provider[] {
  const providers: Provider[] = [];
  if (hasEnv("AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET")) {
    providers.push(
      Google({
        clientId: requiredEnv("AUTH_GOOGLE_ID"),
        clientSecret: requiredEnv("AUTH_GOOGLE_SECRET"),
        authorization: { params: { prompt: "select_account" } },
      }),
    );
  }
  if (hasEnv("AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET")) {
    providers.push(
      GitHub({
        clientId: requiredEnv("AUTH_GITHUB_ID"),
        clientSecret: requiredEnv("AUTH_GITHUB_SECRET"),
      }),
    );
  }
  if (hasEnv("AUTH_MICROSOFT_ENTRA_ID_ID", "AUTH_MICROSOFT_ENTRA_ID_SECRET")) {
    providers.push(
      MicrosoftEntraID({
        clientId: requiredEnv("AUTH_MICROSOFT_ENTRA_ID_ID"),
        clientSecret: requiredEnv("AUTH_MICROSOFT_ENTRA_ID_SECRET"),
        issuer: optionalEnv("AUTH_MICROSOFT_ENTRA_ID_ISSUER"),
      }),
    );
  }
  if (hasEnv("AUTH_OIDC_ID", "AUTH_OIDC_SECRET", "AUTH_OIDC_ISSUER")) {
    providers.push({
      id: "oidc",
      name: optionalEnv("AUTH_OIDC_NAME") ?? "SSO",
      type: "oidc",
      issuer: requiredEnv("AUTH_OIDC_ISSUER"),
      clientId: requiredEnv("AUTH_OIDC_ID"),
      clientSecret: requiredEnv("AUTH_OIDC_SECRET"),
    });
  }
  return providers;
}

const magicLinkProvider = Credentials({
  id: "magic-link",
  name: "Email magic link",
  credentials: { token: { label: "Token", type: "text" } },
  async authorize(credentials) {
    const token = typeof credentials?.token === "string" ? credentials.token : "";
    const verified = await verifyMagicToken(token);
    return verified ? { id: verified.email, email: verified.email } : null;
  },
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [...oauthProviders(), magicLinkProvider],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ profile, user, account }) {
      const email = (profile?.email ?? user?.email ?? "").toLowerCase() || null;
      const profileVerified = profile as { email_verified?: boolean } | undefined;
      return decideSignIn({
        email,
        provider: account?.provider ?? "unknown",
        emailVerified: profileVerified?.email_verified,
        baseUrl: resolveBaseUrl(await headers()),
        isApproved,
        requestAccess: ensureAccessRequest,
      });
    },
  },
});
