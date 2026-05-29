"use server";

import { signIn } from "@/auth";

/**
 * Completes a magic-link sign-in. Driven from a server action (not a GET
 * route) because that's the supported context for NextAuth's credentials
 * `signIn` to set the session cookie and redirect. The token is bound to this
 * action by the verify page; the credentials provider re-verifies it.
 */
export async function completeMagicSignIn(token: string): Promise<void> {
  await signIn("magic-link", { token, redirectTo: "/deck" });
}
