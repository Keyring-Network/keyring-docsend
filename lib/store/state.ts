/**
 * Pure access-state and its transitions. No IO — adapters supply load/save
 * and call these. Keeping the logic here (and timestamps injected) makes it
 * exhaustively unit-testable and keeps adapters free of duplicated rules.
 */

export type PendingRequest = {
  email: string;
  /** Sign-in method used: "google" | "github" | "magic-link" | … */
  provider: string;
  requestedAt: number;
};

export type AuditAction = "request" | "approve" | "reject" | "revoke";

export type AuditEntry = {
  ts: number;
  action: AuditAction;
  subject: string;
  actor: string | null;
};

export type AccessState = {
  viewers: string[];
  pending: Record<string, PendingRequest>;
  audit: AuditEntry[];
};

const MAX_AUDIT = 500;

export const EMPTY_STATE: AccessState = { viewers: [], pending: {}, audit: [] };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Coerce a parsed-JSON blob (file or Edge Config) into a valid AccessState. */
export function normalizeState(raw: unknown): AccessState {
  if (!isPlainObject(raw)) return EMPTY_STATE;
  return {
    viewers: Array.isArray(raw.viewers) ? (raw.viewers as string[]) : [],
    pending: isPlainObject(raw.pending)
      ? (raw.pending as Record<string, PendingRequest>)
      : {},
    audit: Array.isArray(raw.audit) ? (raw.audit as AuditEntry[]) : [],
  };
}

function withAudit(state: AccessState, entry: AuditEntry): AuditEntry[] {
  const next = [...state.audit, entry];
  return next.length <= MAX_AUDIT ? next : next.slice(-MAX_AUDIT);
}

function withoutKey(
  pending: Record<string, PendingRequest>,
  key: string,
): Record<string, PendingRequest> {
  const next = { ...pending };
  delete next[key];
  return next;
}

export function applyAddViewer(
  state: AccessState,
  email: string,
  actor: string | null,
  ts: number,
): AccessState {
  const lower = email.toLowerCase();
  const viewers = state.viewers.includes(lower)
    ? state.viewers
    : [...state.viewers, lower];
  return {
    viewers,
    pending: withoutKey(state.pending, lower),
    audit: withAudit(state, { ts, action: "approve", subject: lower, actor }),
  };
}

export function applyRemoveViewer(
  state: AccessState,
  email: string,
  actor: string | null,
  ts: number,
): AccessState {
  const lower = email.toLowerCase();
  return {
    ...state,
    viewers: state.viewers.filter((v) => v !== lower),
    audit: withAudit(state, { ts, action: "revoke", subject: lower, actor }),
  };
}

export function applyAddPending(
  state: AccessState,
  request: PendingRequest,
  ts: number,
): { state: AccessState; created: boolean } {
  const lower = request.email.toLowerCase();
  if (state.viewers.includes(lower) || state.pending[lower]) {
    return { state, created: false };
  }
  return {
    state: {
      ...state,
      pending: { ...state.pending, [lower]: { ...request, email: lower } },
      audit: withAudit(state, { ts, action: "request", subject: lower, actor: null }),
    },
    created: true,
  };
}

export function applyRejectPending(
  state: AccessState,
  email: string,
  actor: string | null,
  ts: number,
): AccessState {
  const lower = email.toLowerCase();
  if (!state.pending[lower]) return state;
  return {
    ...state,
    pending: withoutKey(state.pending, lower),
    audit: withAudit(state, { ts, action: "reject", subject: lower, actor }),
  };
}
