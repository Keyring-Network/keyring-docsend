import { afterEach, describe, expect, it, vi } from "vitest";
import { redisIO } from "./redis";

const OPTS = { restUrl: "https://redis.example.com", restToken: "tok" };
const EMPTY = { viewers: [], pending: {}, audit: [] };

afterEach(() => {
  vi.restoreAllMocks();
});

function mockCommand(result: unknown, ok = true): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify({ result }), {
        status: ok ? 200 : 500,
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("redisIO load", () => {
  it("parses a stored JSON state", async () => {
    mockCommand(JSON.stringify({ viewers: ["a@x.com"], pending: {}, audit: [] }));
    expect((await redisIO(OPTS).load()).viewers).toEqual(["a@x.com"]);
  });

  it("returns empty state when the key is missing (null)", async () => {
    mockCommand(null);
    expect(await redisIO(OPTS).load()).toEqual(EMPTY);
  });

  it("returns empty state when the stored value is malformed", async () => {
    mockCommand("{ not json");
    expect(await redisIO(OPTS).load()).toEqual(EMPTY);
  });

  it("throws when the command response is not ok", async () => {
    mockCommand(null, false);
    await expect(redisIO(OPTS).load()).rejects.toThrow(/Redis command failed: 500/);
  });
});

describe("redisIO save", () => {
  it("issues a SET with the JSON-encoded state and a custom key", async () => {
    const fetchMock = mockCommand("OK");
    await redisIO({ ...OPTS, key: "custom" }).save({
      viewers: ["a@x.com"],
      pending: {},
      audit: [],
    });
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body[0]).toBe("SET");
    expect(body[1]).toBe("custom");
    expect(JSON.parse(body[2]).viewers).toEqual(["a@x.com"]);
  });

  it("throws when the write fails", async () => {
    mockCommand(null, false);
    await expect(redisIO(OPTS).save(EMPTY)).rejects.toThrow(/failed: 500/);
  });
});
