import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next runs proxy.ts on the Node.js runtime, so the gate can use the access
// store directly (the default JSON driver touches the filesystem).
export default NextAuth(authConfig).auth;

export const config = {
  // Gate everything except NextAuth's own endpoints and Next internals.
  // Note: /content/* (your document) IS matched, so it can't be hit without
  // an approved session.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
