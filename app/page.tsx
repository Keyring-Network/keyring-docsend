import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { enabledOAuthProviders } from "@/lib/providers";
import { siteConfig } from "@/siteConfig";
import { MagicLinkForm } from "@/app/components/MagicLinkForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function startOAuth(formData: FormData): Promise<void> {
  "use server";
  await signIn(String(formData.get("provider")), { redirectTo: "/deck" });
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<React.ReactNode> {
  const params = await searchParams;
  const error = first(params.error);
  const status = first(params.status);
  const session = await auth();
  if (session?.user && !error && !status) redirect("/deck");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div className="card">
        <div className="eyebrow">{siteConfig.siteName}</div>
        <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 600 }}>Sign in</h1>
        <p style={{ margin: "0 0 28px", opacity: 0.7, lineHeight: 1.5 }}>
          {siteConfig.tagline}
        </p>

        {error ? (
          <p role="alert" className="banner banner-warn">
            We couldn&apos;t sign you in. Please try again.
          </p>
        ) : null}
        {status === "request-sent" ? (
          <p role="status" className="banner banner-ok">
            Thanks — your access request has been sent. You&apos;ll get an email once
            it&apos;s approved.
          </p>
        ) : null}

        {enabledOAuthProviders().map((provider) => (
          <form key={provider.id} action={startOAuth} style={{ marginBottom: 10 }}>
            <input type="hidden" name="provider" value={provider.id} />
            <button type="submit" className="btn btn-primary">
              Continue with {provider.label}
            </button>
          </form>
        ))}

        <MagicLinkForm />

        {siteConfig.contactUrl ? (
          <p style={{ margin: "20px 0 0", fontSize: 13, opacity: 0.6 }}>
            <a href={siteConfig.contactUrl}>{siteConfig.contactLabel}</a>
          </p>
        ) : null}
      </div>
    </main>
  );
}
