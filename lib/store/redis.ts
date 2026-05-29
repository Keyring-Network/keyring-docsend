import { normalizeState, type AccessState } from "./state";
import type { StoreIO } from "./createStore";

/**
 * Redis IO over the Upstash REST API — for multi-instance serverless deploys
 * (any platform), where the JSON file isn't shared and Edge Config is
 * Vercel-only. The whole AccessState is stored as one JSON string under a
 * single key. REST + fetch means no driver dependency and no connection
 * pooling, and it's fully mockable.
 *
 * Works with any Upstash-compatible REST endpoint; set REDIS_REST_URL and
 * REDIS_REST_TOKEN to the values your provider gives you.
 */
export type RedisOptions = { restUrl: string; restToken: string; key?: string };

const DEFAULT_KEY = "keyring-docsend:access-state";

async function command(opts: RedisOptions, cmd: unknown[]): Promise<unknown> {
  const res = await fetch(opts.restUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.restToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis command failed: ${res.status}`);
  const json = (await res.json()) as { result: unknown };
  return json.result;
}

export function redisIO(opts: RedisOptions): StoreIO {
  const key = opts.key ?? DEFAULT_KEY;
  return {
    async load() {
      const result = await command(opts, ["GET", key]);
      if (typeof result !== "string") return normalizeState(null);
      try {
        return normalizeState(JSON.parse(result));
      } catch {
        return normalizeState(null);
      }
    },
    async save(state: AccessState) {
      await command(opts, ["SET", key, JSON.stringify(state)]);
    },
  };
}
