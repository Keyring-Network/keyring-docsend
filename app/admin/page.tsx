import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { snapshot } from "@/lib/access";
import { isAdminEmail } from "@/lib/allowlist";
import { AdminRowActions } from "./AdminRowActions";
import { Table } from "./Table";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

function ago(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export default async function AdminPage(): Promise<React.ReactNode> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email) redirect("/");
  if (!isAdminEmail(email)) redirect("/deck");

  const snap = await snapshot();
  const pending = Object.values(snap.pending).sort(
    (a, b) => b.requestedAt - a.requestedAt,
  );
  const audit = [...snap.audit].slice(-20).reverse();

  return (
    <main className={styles.page}>
      <div className="eyebrow">{`Signed in as ${email}`}</div>
      <h1 className={styles.title}>Access</h1>
      <p className={styles.subtitle}>
        Admins come from <code>ADMIN_EMAILS</code>. Approve requests, revoke viewers, and
        review the audit log below.
      </p>

      <h2 className={styles.sectionTitle}>Pending requests ({pending.length})</h2>
      <Table
        head={["Email", "Method", "Requested", ""]}
        rows={pending.map((p) => [
          { label: "Email", node: p.email },
          { label: "Method", node: p.provider },
          { label: "Requested", node: ago(p.requestedAt) },
          { label: "", node: <AdminRowActions kind="pending" email={p.email} /> },
        ])}
      />

      <h2 className={styles.sectionTitle}>Viewers ({snap.viewers.length})</h2>
      <Table
        head={["Email", ""]}
        rows={snap.viewers.map((v) => [
          { label: "Email", node: v },
          { label: "", node: <AdminRowActions kind="viewer" email={v} /> },
        ])}
      />

      <h2 className={styles.sectionTitle}>Admins ({snap.admins.length})</h2>
      <Table
        head={["Email"]}
        rows={snap.admins.map((a) => [{ label: "Email", node: a }])}
      />

      <h2 className={styles.sectionTitle}>Recent activity</h2>
      <Table
        head={["When", "Action", "Subject", "By"]}
        rows={audit.map((e) => [
          { label: "When", node: ago(e.ts) },
          { label: "Action", node: e.action },
          { label: "Subject", node: e.subject },
          { label: "By", node: e.actor ?? "—" },
        ])}
      />
    </main>
  );
}
