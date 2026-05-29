import { getAdminEmails, isAdminEmail } from "./allowlist";
import { getStore } from "./store";
import type { AccessState } from "./store";

export { isAdminEmail as isAdmin } from "./allowlist";

/** True if the email is an admin or an approved viewer. */
export async function isApproved(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const lower = email.toLowerCase();
  if (isAdminEmail(lower)) return true;
  const state = await getStore().read();
  return state.viewers.includes(lower);
}

export type AccessSnapshot = AccessState & { admins: string[] };

/** Full picture for the admin page: env admins plus stored state. */
export async function snapshot(): Promise<AccessSnapshot> {
  const state = await getStore().read();
  return { admins: [...getAdminEmails()], ...state };
}
