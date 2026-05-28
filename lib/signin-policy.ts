/**
 * The sign-in decision, factored out of the NextAuth callback so it can be
 * unit-tested. Dependencies (approval check, request recorder) are injected.
 *
 * Returns `true` to allow, `false` to deny, or a URL string to redirect to
 * (NextAuth treats a returned string as a redirect target).
 */
export type SignInDecision = boolean | string;

export type SignInPolicyInput = {
  email: string | null;
  provider: string;
  /** From the OAuth profile; only some providers set it. */
  emailVerified: boolean | undefined;
  baseUrl: string;
  isApproved: (email: string) => Promise<boolean>;
  requestAccess: (input: {
    email: string;
    provider: string;
    baseUrl: string;
  }) => Promise<unknown>;
};

export async function decideSignIn(input: SignInPolicyInput): Promise<SignInDecision> {
  const { email, provider } = input;
  if (!email) return false;
  if (input.emailVerified === false) return false;
  if (await input.isApproved(email)) return true;

  // The magic-link request flow already records the access request; the
  // sign-in callback must not double-record it.
  if (provider === "magic-link") return false;

  await input.requestAccess({ email, provider, baseUrl: input.baseUrl });
  return "/?status=request-sent";
}
