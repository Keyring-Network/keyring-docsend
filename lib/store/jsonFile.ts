import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { EMPTY_STATE, normalizeState } from "./state";
import type { StoreIO } from "./createStore";

const FILE_NAME = "access-state.json";

/**
 * Filesystem-backed IO. The default driver: zero config, works anywhere with
 * a writable disk (Docker, a VPS, local dev). Not suitable for ephemeral
 * serverless filesystems — use the edge-config driver there.
 *
 * Writes are atomic (write to a temp file, then rename) so a crash mid-write
 * can't corrupt the store.
 */
export function jsonFileIO(dir: string): StoreIO {
  const file = join(dir, FILE_NAME);
  return {
    async load() {
      try {
        const text = await readFile(file, "utf8");
        return normalizeState(JSON.parse(text));
      } catch {
        return EMPTY_STATE;
      }
    },
    async save(state) {
      await mkdir(dir, { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
      await rename(tmp, file);
    },
  };
}
