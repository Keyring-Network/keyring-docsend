import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// The gate runs on every request. It needs the access store (which, for the
// default JSON driver, touches the filesystem), so it runs in the Node.js
// runtime rather than the Edge runtime.
export const runtime = "nodejs";

export default NextAuth(authConfig).auth;

export const config = {
  // Gate everything except NextAuth's own endpoints and Next internals.
  // Note: /content/* (your document) IS matched, so it can't be hit without
  // an approved session.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
