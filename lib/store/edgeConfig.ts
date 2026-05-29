import { normalizeState, type AccessState } from "./state";
import type { StoreIO } from "./createStore";

/**
 * Vercel Edge Config IO via the REST API — for serverless deploys where the
 * filesystem isn't persistent. Reads and writes go through the Vercel API
 * (no SDK dependency), so it's fully mockable and dependency-free. Suitable
 * for the low write-rate of a gated-document tool.
 */
export type EdgeConfigOptions = {
  connectionString: string;
  apiToken: string;
  teamId?: string;
};

/** Extract the Edge Config id from its connection string. */
function parseConfigId(connectionString: string): string {
  const match = connectionString.match(/edge-config\.vercel\.com\/([^/?]+)/);
  if (!match) {
    throw new Error("EDGE_CONFIG connection string is malformed");
  }
  return match[1];
}

function itemsUrl(id: string, teamId?: string): string {
  const url = new URL(`https://api.vercel.com/v1/edge-config/${id}/items`);
  if (teamId) url.searchParams.set("teamId", teamId);
  return url.toString();
}

export function edgeConfigIO(opts: EdgeConfigOptions): StoreIO {
  const id = parseConfigId(opts.connectionString);
  const url = itemsUrl(id, opts.teamId);
  const authHeader = { Authorization: `Bearer ${opts.apiToken}` };

  return {
    async load() {
      const res = await fetch(url, { headers: authHeader, cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Edge Config read failed: ${res.status}`);
      }
      const items = (await res.json()) as Array<{ key: string; value: unknown }>;
      const blob: Record<string, unknown> = {};
      for (const item of items) blob[item.key] = item.value;
      return normalizeState(blob);
    },

    async save(state: AccessState) {
      const body = {
        items: (["viewers", "pending", "audit"] as const).map((key) => ({
          operation: "upsert" as const,
          key,
          value: state[key],
        })),
      };
      const res = await fetch(url, {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`Edge Config write failed: ${res.status}`);
      }
    },
  };
}
