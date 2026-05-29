"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveRequest,
  rejectRequest,
  revokeViewer,
  type ActionResult,
} from "./actions";

export function AdminRowActions({
  email,
  kind,
}: {
  email: string;
  kind: "pending" | "viewer";
}): React.ReactNode {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>, confirmMsg?: string): void {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  const buttons =
    kind === "pending"
      ? [
          { label: "Approve", fn: (): Promise<ActionResult> => approveRequest(email) },
          { label: "Reject", fn: (): Promise<ActionResult> => rejectRequest(email) },
        ]
      : [
          {
            label: "Revoke",
            fn: (): Promise<ActionResult> => revokeViewer(email),
            confirm: `Revoke access for ${email}?`,
          },
        ];

  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      {error ? (
        <span style={{ color: "var(--accent)", fontSize: 12 }}>{error}</span>
      ) : null}
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          disabled={pending}
          className="btn"
          style={{ width: "auto", padding: "6px 12px", fontSize: 13 }}
          onClick={() => run(b.fn, "confirm" in b ? b.confirm : undefined)}
        >
          {pending ? "…" : b.label}
        </button>
      ))}
    </span>
  );
}
