import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/allowlist";

/**
 * The viewer's identity, for custom HTML decks that want to show who's
 * viewing. Gated by the proxy — unauthenticated callers never reach it.
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  const res = NextResponse.json({ email, isAdmin: isAdminEmail(email) });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
