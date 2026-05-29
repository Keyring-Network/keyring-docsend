# keyring-docsend

A self-hostable, gated way to share a document — an open-source take on
DocSend. Drop in your deck, decide who's allowed, and everyone else only gets
a polite "request access" button.

- **Auth, your way** — Google, GitHub, Microsoft Entra ID, any OIDC provider,
  and email magic links. Each turns on automatically when you set its env vars.
- **Approval workflow** — anyone can request access; admins approve or reject
  with one click from their inbox. Instant revoke.
- **Bring any document** — a static HTML export, a PDF, or a folder of images.
- **Runs anywhere** — a JSON file is the default store (Docker, a VPS, your
  laptop). Vercel Edge Config is a one-line switch for serverless.
- **No required cloud services** — with no mailer configured, magic links print
  to the server console, so it works the moment you clone it.

## Contents

- [Quick start](#quick-start)
- [For agents](#for-agents)
- [Configure](#configure)
- [How access works](#how-access-works)
- [Deploy](#deploy)
- [Quality bar](#quality-bar)
- [License](#license)

## Quick start

```bash
pnpm install
pnpm setup          # generates AUTH_SECRET, writes .env.local
# set ADMIN_EMAILS in .env.local (at least your own email)
pnpm dev            # http://localhost:3000
```

Sign in with your admin email via the magic-link form. With no mailer set up,
the link is printed to the terminal running `pnpm dev` — paste it into your
browser. You're in; the sample document is at `/deck`.

## For agents

A speed-run for a coding agent. Read [AGENTS.md](./AGENTS.md) first — it has
the rules that will save you a wasted round trip.

**Get it running (no accounts, no secrets):**

```bash
pnpm install
printf 'AUTH_SECRET=%s\nADMIN_EMAILS=you@example.com\n' "$(openssl rand -base64 32)" > .env.local
pnpm dev
```

Then `POST` nothing — just open `/`, enter `you@example.com`, and read the
magic link from the dev server's stdout (`[mailer:console] …`). That admin
session reaches `/deck` and `/admin`.

**The map:**

- `lib/` — all the logic, each module pure and 100% covered. Start here.
  - `store/` — `getStore()` picks json / edge-config / redis; transitions in `state.ts`.
  - `mailer/` — templates + transports (`selectTransport()`).
  - `access.ts`, `access-flow.ts`, `tokens.ts`, `providers.ts`, `routes.ts`, `signin-policy.ts`.
- `app/` — thin glue only (pages, route handlers, server actions). No logic here.
- `auth.ts` / `auth.config.ts` / `proxy.ts` — NextAuth wiring + the gate.
- `siteConfig.ts` — branding + which document to serve.

**Before you commit, this must pass (the hooks enforce it):**

```bash
pnpm verify   # typecheck + lint + jscpd (0% dupes) + 100% lib coverage
```

**Non-negotiables** (full list in AGENTS.md): new logic lands in `lib/` with a
100%-covering test; `app/` stays thin; don't widen the lint caps or skip hooks;
credentials `signIn` runs from a server action, never a route handler; secrets
are env-only.

## Configure

Two places, by design:

- **`siteConfig.ts`** — non-secret branding + which document to serve. Edit
  freely.
- **Environment variables** — every secret and provider toggle. See
  `.env.example`.

### Core env

| Var            | Required | Notes                                                             |
| -------------- | -------- | ----------------------------------------------------------------- |
| `AUTH_SECRET`  | yes      | `openssl rand -base64 32`. Signs sessions + tokens.               |
| `ADMIN_EMAILS` | yes      | Comma/space/semicolon list. Admins can approve, revoke, and view. |
| `AUTH_URL`     | prod     | Canonical URL for links in emails. Most hosts set it for you.     |

### Auth providers (enable any subset)

Set the vars for a provider and it appears on the sign-in page. The OAuth
redirect URI is `https://<your-domain>/api/auth/callback/<id>`.

| Provider           | id                   | Env vars                                                                 |
| ------------------ | -------------------- | ------------------------------------------------------------------------ |
| Google             | `google`             | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`                                   |
| GitHub             | `github`             | `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`                                   |
| Microsoft Entra ID | `microsoft-entra-id` | `AUTH_MICROSOFT_ENTRA_ID_ID`, `..._SECRET`, `..._ISSUER`                 |
| Generic OIDC       | `oidc`               | `AUTH_OIDC_ID`, `AUTH_OIDC_SECRET`, `AUTH_OIDC_ISSUER`, `AUTH_OIDC_NAME` |
| Email magic link   | `magic-link`         | always on (uses the mailer)                                              |

### Mailer (magic links + approval emails)

Picked in order: **Resend** → **SMTP** → **console** (dev fallback).

| Driver  | Env                                                                                                  |
| ------- | ---------------------------------------------------------------------------------------------------- |
| Resend  | `RESEND_API_KEY`, `EMAIL_FROM`                                                                       |
| SMTP    | `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM` |
| Console | nothing — links are logged (dev only)                                                                |

### Storage (viewers, pending requests, audit)

Magic-link tokens are stateless JWTs, so they need no storage. The mutable
access state does.

| `STORAGE_DRIVER` | Use when                             | Env                                                 |
| ---------------- | ------------------------------------ | --------------------------------------------------- |
| `json` (default) | Docker, a VPS, anything long-running | `DATA_DIR` (default `./.data`)                      |
| `edge-config`    | Serverless on Vercel                 | `EDGE_CONFIG`, `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID` |
| `redis`          | Multi-instance serverless, any host  | `REDIS_REST_URL`, `REDIS_REST_TOKEN`, `REDIS_KEY?`  |

> The JSON driver writes to a local file, which won't persist on ephemeral
> serverless filesystems. For serverless use `edge-config` (Vercel) or `redis`
> (Upstash-compatible REST, works anywhere and across instances).

### Your document

Put files in `public/content/` and set `siteConfig.content.type`:

- `html` → static export with an `index.html`; `/deck` redirects to it.
- `pdf` → a single PDF, embedded.
- `images` → ordered images, shown as a slideshow.

PowerPoint? Export to PDF or images first — browsers can't render `.pptx`.

## How access works

1. A visitor hits the deck and signs in (any provider) or asks for a magic link.
2. If they're not an admin or an approved viewer, a **pending request** is
   recorded and every admin gets an email with **Approve** / **Reject** links.
3. First admin to click decides. On approval the requester is emailed a
   sign-in link (magic link) or a "sign in again" nudge (OAuth).
4. Admins manage everyone at **`/admin`** — pending requests, viewers, the
   admin list, and a recent-activity log. Revoke is immediate.

The gate (`proxy.ts`) enforces this on every request: `/`, `/signin/verify`
and `/api/access/decide` are public; `/admin` is admin-only; everything else
(including `/content/*`) requires an approved session.

## Deploy

- **Vercel** — import the repo, set env vars, and use `STORAGE_DRIVER=edge-config`
  with an Edge Config attached (the filesystem isn't persistent there).
- **Docker** — `docker build -t keyring-docsend .`, then run with your env and a
  volume for `DATA_DIR` (e.g. `-v $PWD/data:/app/.data -e DATA_DIR=/app/.data`).
- **Node** — `pnpm build && pnpm start` behind your reverse proxy.

## Quality bar

This repo holds itself to a strict standard (see CONTRIBUTING.md):

- 100% test coverage on `lib/` (all logic lives there).
- ESLint caps on file length, function length, complexity, and params.
- 0% duplication (jscpd).
- Pre-commit (lint + format + dupes) and pre-push (typecheck + coverage) hooks.

```bash
pnpm verify   # typecheck + lint + dupes + 100% coverage
```

## License

MIT. See [LICENSE](./LICENSE).
