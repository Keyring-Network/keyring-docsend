"use client";

import { useEffect, useRef } from "react";

/**
 * Auto-submits the bound server action on mount, so clicking the email link
 * lands the user straight into the deck. Degrades to a manual button without
 * JS.
 */
export function CompleteSignIn({
  action,
}: {
  action: () => void | Promise<void>;
}): React.ReactNode {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    ref.current?.requestSubmit();
  }, []);

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
      <form ref={ref} action={action} className="card" style={{ textAlign: "center" }}>
        <p style={{ margin: 0, opacity: 0.8 }}>Signing you in…</p>
        <noscript>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>
            Continue
          </button>
        </noscript>
      </form>
    </main>
  );
}
