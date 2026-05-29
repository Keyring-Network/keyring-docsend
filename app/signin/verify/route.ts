import { type NextRequest, NextResponse } from "next/server";
import { signIn } from "@/auth";
import { isApproved } from "@/lib/access";
import { verifyMagicToken } from "@/lib/tokens";

/**
 * Magic-link landing endpoint. Verifies the token, re-checks approval (it may
 * have changed since the link was issued), then signs the user in via the
 * credentials provider. A Route Handler — signIn() needs to set cookies.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const token = req.nextUrl.searchParams.get("token");
  const verified = await verifyMagicToken(token);
  if (!verified) {
    return NextResponse.redirect(new URL("/?error=invalid-link", req.url));
  }
  if (!(await isApproved(verified.email))) {
    return NextResponse.redirect(new URL("/?error=not-approved", req.url));
  }
  // signIn throws a redirect with the session cookie set.
  await signIn("magic-link", { token, redirectTo: "/deck" });
  return NextResponse.redirect(new URL("/deck", req.url));
}
