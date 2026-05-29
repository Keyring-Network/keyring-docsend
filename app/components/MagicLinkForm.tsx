"use client";

import { useActionState } from "react";
import { requestMagicLink, type MagicLinkResult } from "@/app/actions/request-magic-link";

function successMessage(status: "sent" | "requested", ttlMinutes: number): string {
  if (status === "sent") {
    return `A sign-in link is on its way. It's valid for ${ttlMinutes} minutes.`;
  }
  return "Thanks — your request has been sent. You'll get an email once it's approved.";
}

export function MagicLinkForm(): React.ReactNode {
  const [state, formAction, pending] = useActionState<MagicLinkResult | null, FormData>(
    requestMagicLink,
    null,
  );
  const success = state?.ok === true;
  const error = state && state.ok === false ? state.error : null;

  let buttonLabel = "Send link";
  if (pending) buttonLabel = "Sending…";
  else if (success) buttonLabel = "Sent";

  return (
    <form action={formAction} style={{ marginTop: 16 }}>
      <label
        htmlFor="email"
        className="eyebrow"
        style={{ display: "block", marginBottom: 8 }}
      >
        Or sign in with email
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          disabled={pending || success}
          className="field"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={pending || success}
          className="btn"
          style={{ width: "auto", whiteSpace: "nowrap" }}
        >
          {buttonLabel}
        </button>
      </div>
      {success ? (
        <p className="banner banner-ok" style={{ marginTop: 12, marginBottom: 0 }}>
          {successMessage(state.status, state.ttlMinutes)}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="banner banner-warn"
          style={{ marginTop: 12, marginBottom: 0 }}
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
