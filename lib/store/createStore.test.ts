import { describe, expect, it, vi } from "vitest";
import { createStore, type StoreIO } from "./createStore";
import { EMPTY_STATE, type AccessState, type PendingRequest } from "./state";

function memoryIO(initial: AccessState = EMPTY_STATE): {
  io: StoreIO;
  current: () => AccessState;
  save: ReturnType<typeof vi.fn>;
} {
  let state = initial;
  const save = vi.fn(async (next: AccessState) => {
    state = next;
  });
  return {
    io: { load: async () => state, save },
    current: () => state,
    save,
  };
}

const req = (email: string): PendingRequest => ({
  email,
  provider: "magic-link",
  requestedAt: 0,
});

describe("createStore", () => {
  it("read delegates to load", async () => {
    const { io } = memoryIO({ viewers: ["a@x.com"], pending: {}, audit: [] });
    const store = createStore(io, () => 1);
    expect((await store.read()).viewers).toEqual(["a@x.com"]);
  });

  it("addViewer loads, applies, saves with injected clock", async () => {
    const { io, current } = memoryIO();
    const store = createStore(io, () => 42);
    await store.addViewer("A@x.com", "admin@x.com");
    expect(current().viewers).toEqual(["a@x.com"]);
    expect(current().audit[0]).toMatchObject({ ts: 42, action: "approve" });
  });

  it("removeViewer persists the removal", async () => {
    const { io, current } = memoryIO({
      viewers: ["a@x.com"],
      pending: {},
      audit: [],
    });
    const store = createStore(io, () => 1);
    await store.removeViewer("a@x.com", null);
    expect(current().viewers).toEqual([]);
  });

  it("addPending saves and returns created=true on a new request", async () => {
    const { io, save } = memoryIO();
    const store = createStore(io, () => 1);
    expect(await store.addPending(req("a@x.com"))).toEqual({ created: true });
    expect(save).toHaveBeenCalledOnce();
  });

  it("addPending does not save when not created", async () => {
    const { io, save } = memoryIO({ viewers: ["a@x.com"], pending: {}, audit: [] });
    const store = createStore(io, () => 1);
    expect(await store.addPending(req("a@x.com"))).toEqual({ created: false });
    expect(save).not.toHaveBeenCalled();
  });

  it("rejectPending persists", async () => {
    const { io, current } = memoryIO({
      viewers: [],
      pending: { "a@x.com": req("a@x.com") },
      audit: [],
    });
    const store = createStore(io, () => 1);
    await store.rejectPending("a@x.com", "ad");
    expect(current().pending).toEqual({});
  });

  it("defaults the clock to Date.now", async () => {
    const { io, current } = memoryIO();
    const store = createStore(io);
    await store.addViewer("a@x.com", null);
    expect(current().audit[0].ts).toBeGreaterThan(0);
  });
});
