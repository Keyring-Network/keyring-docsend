import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { jsonFileIO } from "./jsonFile";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "kds-store-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("jsonFileIO", () => {
  it("returns empty state when the file is missing", async () => {
    const io = jsonFileIO(join(dir, "does-not-exist-yet"));
    expect(await io.load()).toEqual({ viewers: [], pending: {}, audit: [] });
  });

  it("saves then loads a round trip, creating the dir", async () => {
    const io = jsonFileIO(join(dir, "nested", "data"));
    await io.save({ viewers: ["a@x.com"], pending: {}, audit: [] });
    expect((await io.load()).viewers).toEqual(["a@x.com"]);
  });

  it("returns empty state when the file is malformed JSON", async () => {
    const io = jsonFileIO(dir);
    await writeFile(join(dir, "access-state.json"), "{ not json", "utf8");
    expect(await io.load()).toEqual({ viewers: [], pending: {}, audit: [] });
  });
});
