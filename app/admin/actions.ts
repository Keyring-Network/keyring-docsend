"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { performApproval } from "@/lib/access-flow";
import { isAdminEmail } from "@/lib/allowlist";
import { resolveBaseUrl } from "@/lib/base-url";
import { getStore } from "@/lib/store";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email || !isAdminEmail(email)) throw new Error("Forbidden");
  return email;
}

async function adminAction(run: (actor: string) => Promise<void>): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    await run(actor);
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Action failed. Try again." };
  }
}

export async function approveRequest(email: string): Promise<ActionResult> {
  return adminAction(async (actor) => {
    await performApproval({ email, actor, baseUrl: resolveBaseUrl(await headers()) });
  });
}

export async function rejectRequest(email: string): Promise<ActionResult> {
  return adminAction((actor) => getStore().rejectPending(email, actor));
}

export async function revokeViewer(email: string): Promise<ActionResult> {
  return adminAction(async (actor) => {
    if (isAdminEmail(email)) throw new Error("Admins are managed via ADMIN_EMAILS");
    await getStore().removeViewer(email, actor);
  });
}
