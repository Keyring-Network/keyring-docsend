import { optionalEnv, requiredEnv } from "../env";
import { createStore, type Store } from "./createStore";
import { jsonFileIO } from "./jsonFile";
import { edgeConfigIO } from "./edgeConfig";
import { redisIO } from "./redis";

export type { Store } from "./createStore";
export type { AccessState, AuditEntry, PendingRequest } from "./state";

/**
 * Build the configured store. STORAGE_DRIVER selects the adapter:
 *   "edge-config" → Vercel Edge Config (Vercel serverless)
 *   "redis"       → Upstash-compatible Redis over REST (any serverless)
 *   "json" (default) → local JSON file at DATA_DIR (default ./.data)
 */
export function getStore(): Store {
  const driver = optionalEnv("STORAGE_DRIVER");
  if (driver === "edge-config") {
    return createStore(
      edgeConfigIO({
        connectionString: requiredEnv("EDGE_CONFIG"),
        apiToken: requiredEnv("VERCEL_API_TOKEN"),
        teamId: optionalEnv("VERCEL_TEAM_ID"),
      }),
    );
  }
  if (driver === "redis") {
    return createStore(
      redisIO({
        restUrl: requiredEnv("REDIS_REST_URL"),
        restToken: requiredEnv("REDIS_REST_TOKEN"),
        key: optionalEnv("REDIS_KEY"),
      }),
    );
  }
  return createStore(jsonFileIO(optionalEnv("DATA_DIR") ?? ".data"));
}
