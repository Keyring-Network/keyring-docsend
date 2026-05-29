import type { NextAuthConfig } from "next-auth";
import { isApproved } from "@/lib/access";
import { isAdminEmail } from "@/lib/allowlist";
import { classifyRoute } from "@/lib/routes";

/**
 * Edge-safe slice of the auth config used by the proxy gate. The route rules
 * are in lib/routes (tested); this just maps a class to an allow decision.
 */
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: { signIn: "/", error: "/" },
  callbacks: {
    async authorized({ auth, request }) {
      const routeClass = classifyRoute(request.nextUrl.pathname);
      if (routeClass === "public") return true;

      const email = auth?.user?.email ?? null;
      if (!email) return false;
      if (routeClass === "admin") return isAdminEmail(email);
      return isApproved(email);
    },
  },
};
