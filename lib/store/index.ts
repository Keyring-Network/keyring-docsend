import { optionalEnv, requiredEnv } from "../env";
import { createStore, type Store } from "./createStore";
import { jsonFileIO } from "./jsonFile";
import { edgeConfigIO } from "./edgeConfig";

export type { Store } from "./createStore";
export type { AccessState, AuditEntry, PendingRequest } from "./state";

/**
 * Build the configured store. STORAGE_DRIVER selects the adapter:
 *   "edge-config" → Vercel Edge Config (serverless)
 *   "json" (default) → local JSON file at DATA_DIR (default ./.data)
 */
export function getStore(): Store {
  if (optionalEnv("STORAGE_DRIVER") === "edge-config") {
    return createStore(
      edgeConfigIO({
        connectionString: requiredEnv("EDGE_CONFIG"),
        apiToken: requiredEnv("VERCEL_API_TOKEN"),
        teamId: optionalEnv("VERCEL_TEAM_ID"),
      }),
    );
  }
  return createStore(jsonFileIO(optionalEnv("DATA_DIR") ?? ".data"));
}
