import { afterEach, describe, expect, it, vi } from "vitest";
import { edgeConfigIO } from "./edgeConfig";

const CONN = "https://edge-config.vercel.com/ecfg_abc123?token=tok";
const OPTS = { connectionString: CONN, apiToken: "api-tok" };

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(impl: (url: string, init?: RequestInit) => Response): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => impl(url, init)),
  );
}

describe("edgeConfigIO", () => {
  it("throws on a malformed connection string", () => {
    expect(() => edgeConfigIO({ connectionString: "nope", apiToken: "t" })).toThrow(
      /malformed/,
    );
  });

  it("loads and assembles state from items", async () => {
    mockFetch(() =>
      Response.json([
        { key: "viewers", value: ["a@x.com"] },
        { key: "pending", value: {} },
        { key: "audit", value: [] },
      ]),
    );
    const io = edgeConfigIO(OPTS);
    expect((await io.load()).viewers).toEqual(["a@x.com"]);
  });

  it("throws when the read response is not ok", async () => {
    mockFetch(() => new Response("nope", { status: 500 }));
    await expect(edgeConfigIO(OPTS).load()).rejects.toThrow(/read failed: 500/);
  });

  it("writes an upsert PATCH and includes the team id in the URL", async () => {
    const seen: { url: string; init?: RequestInit } = { url: "" };
    mockFetch((url, init) => {
      seen.url = url;
      seen.init = init;
      return new Response(null, { status: 200 });
    });
    const io = edgeConfigIO({ ...OPTS, teamId: "team_1" });
    await io.save({ viewers: ["a@x.com"], pending: {}, audit: [] });
    expect(seen.url).toContain("teamId=team_1");
    expect(seen.init?.method).toBe("PATCH");
    const body = JSON.parse(String(seen.init?.body));
    expect(body.items.map((i: { key: string }) => i.key)).toEqual([
      "viewers",
      "pending",
      "audit",
    ]);
  });

  it("throws when the write response is not ok", async () => {
    mockFetch(() => new Response(null, { status: 403 }));
    await expect(
      edgeConfigIO(OPTS).save({ viewers: [], pending: {}, audit: [] }),
    ).rejects.toThrow(/write failed: 403/);
  });
});
