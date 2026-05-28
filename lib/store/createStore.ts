import {
  applyAddPending,
  applyAddViewer,
  applyRejectPending,
  applyRemoveViewer,
  type AccessState,
  type PendingRequest,
} from "./state";

/** Persistence primitive an adapter must provide. */
export type StoreIO = {
  load: () => Promise<AccessState>;
  save: (state: AccessState) => Promise<void>;
};

/** The access store surface the rest of the app uses. */
export type Store = {
  read(): Promise<AccessState>;
  addViewer(email: string, actor: string | null): Promise<void>;
  removeViewer(email: string, actor: string | null): Promise<void>;
  addPending(request: PendingRequest): Promise<{ created: boolean }>;
  rejectPending(email: string, actor: string | null): Promise<void>;
};

/**
 * Build a Store from an IO adapter. The state transitions are pure (see
 * state.ts); this wires them to read-modify-write. `now` is injectable for
 * deterministic tests.
 */
export function createStore(io: StoreIO, now: () => number = Date.now): Store {
  return {
    read: io.load,

    async addViewer(email, actor): Promise<void> {
      const state = await io.load();
      await io.save(applyAddViewer(state, email, actor, now()));
    },

    async removeViewer(email, actor): Promise<void> {
      const state = await io.load();
      await io.save(applyRemoveViewer(state, email, actor, now()));
    },

    async addPending(request): Promise<{ created: boolean }> {
      const state = await io.load();
      const result = applyAddPending(state, request, now());
      if (result.created) await io.save(result.state);
      return { created: result.created };
    },

    async rejectPending(email, actor): Promise<void> {
      const state = await io.load();
      await io.save(applyRejectPending(state, email, actor, now()));
    },
  };
}
