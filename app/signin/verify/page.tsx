import { redirect } from "next/navigation";
import { isApproved } from "@/lib/access";
import { verifyMagicToken } from "@/lib/tokens";
import { completeMagicSignIn } from "./actions";
import { CompleteSignIn } from "./CompleteSignIn";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Magic-link landing page. Verifies the token and re-checks approval (it may
 * have changed since the link was issued), then hands off to a server action
 * to establish the session.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<React.ReactNode> {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  const verified = await verifyMagicToken(token);
  if (!verified) redirect("/?error=invalid-link");
  if (!(await isApproved(verified.email))) redirect("/?error=not-approved");

  return <CompleteSignIn action={completeMagicSignIn.bind(null, token as string)} />;
}
