# Working on this repo

This is keyring-docsend: a self-hostable, gated way to share one document.
It's a Next.js app that puts an auth wall in front of a deck (HTML, a PDF, or
images), lets people request access, and lets admins approve or revoke them.
That's the whole product. There's no dashboard-builder, no multi-tenant SaaS,
no plugin system. One document, gated, with a request/approve loop.

It's also an open-source repo with a deliberately strict bar. The hooks will
block you before CI does. Read this before you start so they don't.

## A note before you start

The point of this codebase is that the logic is small, pure, and exhaustively
tested, and the framework glue is thin and boring. If you find yourself writing
a clever 80-line React component with real branching logic in it, stop. That
logic belongs in `lib/` with a test. The component should be dumb.

The quality gates are not suggestions. Pre-commit runs lint + format + a
0%-duplication check; pre-push runs typecheck + 100% coverage of `lib/`. CI
runs the lot again. If a gate fails, it found something real. Fix it; don't
route around it.

## Glossary

- **You**: the agent reading this. You're here to change the wrapper, the auth
  flow, the storage/mailer adapters, or the gating logic.
- **The maintainer / operator**: whoever runs an instance. They edit
  `siteConfig.ts` and set env vars. They don't read your code; they read the
  README.
- **Admins**: emails in the `ADMIN_EMAILS` env var. They approve, reject,
  revoke, and view. There is no hard-coded fallback admin.
- **Viewers**: emails approved at runtime, stored in the access store. View
  only.
- **Requesters**: people who tried to sign in and aren't approved yet. They
  sit in `pending` until an admin decides.
- **The document**: whatever the operator drops in `public/content/`. Not
  yours to design — it's their deck.

## Hard rules

### All logic lives in `lib/`, at 100% coverage

`lib/` is the logic layer: small, pure, dependency-injected functions, each
with a colocated `*.test.ts`. Coverage is gated at 100% (lines, branches,
functions, statements) and scoped to `lib/`. New behaviour goes here with a
test that exercises every branch.

If a function is hard to test, that's the function telling you to inject its
dependencies instead of reaching for `getStore()` / `fetch` / the clock
directly. Look at how `createStore` takes a `now()`, how `decideSignIn` takes
`isApproved` and `requestAccess`, how the send helpers take a `Transport`.
Follow that.

### `app/` is thin glue, and stays that way

Pages, route handlers, and server actions wire `lib/` to the framework. They
read a request, call a tested function, and render or redirect. They do not
contain decisions. `app/` is intentionally outside the coverage gate, so any
real logic hiding there is untested logic. Push it down into `lib/`.

### Don't widen the gates to make your change fit

The ESLint caps (complexity 10, ~250 lines/file, ~50 lines/function, 4 params,
no `any`) and the 0% duplication rule are the spec. If you're about to bump a
limit or add an `eslint-disable`, you almost certainly want to split a function
or extract a helper instead. Adding a dependency to dodge a complexity warning
is not a fix.

### Credentials `signIn` runs from a server action, never a route handler

This one already bit us. Calling NextAuth's `signIn` for the magic-link
credentials provider from a GET route handler works in `next dev` and then
500s on a production build at `/api/auth/callback/magic-link`. The magic-link
verify flow is a server component page that hands off to a server action
(`app/signin/verify/`) for exactly this reason. If you touch sign-in, keep the
`signIn` call in a server action and test it against `next start`, not just
`next dev`.

### Storage, mailer, and providers are pluggable. Add an adapter, don't special-case

- A new store backend is a `StoreIO` (`load` + `save`) wired into the
  `getStore()` factory. The transitions in `lib/store/state.ts` are shared and
  must not be duplicated per adapter.
- A new mailer is a `Transport` (`send`) wired into `selectTransport()`.
- A new auth provider is one entry in `lib/providers.ts` (so the UI sees it)
  plus its instantiation in `auth.ts`. The two read the same env checks; keep
  them in sync through `lib/providers.ts`, not by hand.

### Secrets are env-only

`siteConfig.ts` is branding and content config. No keys, no tokens, no admin
emails, ever. Everything secret is an environment variable, documented in
`.env.example`. This repo is public; treat it that way.

### `next-auth` is pinned to an exact beta on purpose

There's no stable v5 yet and betas break between patches. Don't widen it to a
caret or bump it casually. Bump deliberately, run `pnpm verify`, and smoke-test
a real sign-in against `next start` before committing.

## How the pieces fit

- **Auth** (`auth.ts`): Google, GitHub, Microsoft Entra, generic OIDC, and a
  magic-link credentials provider. Each OAuth provider turns on only when its
  env vars are present (`lib/providers.ts` decides; the sign-in page and
  `auth.ts` both read from it).
- **The gate** (`proxy.ts` + `auth.config.ts`): runs on every request.
  `lib/routes.ts` classifies the path as public / admin / protected;
  `authorized()` allows accordingly. `/`, `/signin/verify`, and
  `/api/access/decide` are public; `/admin` needs an admin; everything else
  (including `/content/*`) needs an approved session.
- **The request/approve loop** (`lib/access-flow.ts`): an unapproved sign-in
  records a `pending` entry and emails every admin a signed approve/reject
  link. Approval promotes them to viewer and emails them a way back in.
- **Storage** (`lib/store/`): json file (default), Vercel Edge Config, or
  Redis/Upstash REST, behind one interface.
- **Mailer** (`lib/mailer/`): Resend, SMTP, or a console fallback that prints
  links in dev so the app runs with zero email config.

## Common traps

### The hooks reformat and re-lint your staged files

Pre-commit runs lint-staged, which means Prettier may rewrite your file and
ESLint may reject it. If a commit "fails," read the output — it usually tells
you the exact rule. The lockfile and generated Next types also matter: see
below.

### Sync the lockfile when you touch dependencies

CI runs `pnpm install --frozen-lockfile`. If you add or remove a dependency and
don't commit the updated `pnpm-lock.yaml`, CI fails with
`ERR_PNPM_OUTDATED_LOCKFILE`. Run `pnpm install` and commit the lockfile in the
same change.

### `next-env.d.ts` churns; it's gitignored

`next dev` and `next build` write different import paths into `next-env.d.ts`,
so it's gitignored on purpose. Don't commit it. Don't be surprised if `pnpm
typecheck` complains after switching between dev and build — `rm -rf .next` and
rebuild.

### The JSON store doesn't survive serverless

The default `json` driver writes a local file. That's perfect for Docker, a
VPS, or local dev, and useless on an ephemeral serverless filesystem. For
serverless point `STORAGE_DRIVER` at `edge-config` (Vercel) or `redis`
(anywhere, multi-instance).

### Don't trust "works in dev" for auth

Dev and production builds handle server actions and route handlers differently
enough that auth bugs hide in dev. The full sign-in loop is validated against
`next start` in a real browser for a reason. If you change auth, do the same.

## General rules

These are the defaults. Push back if a situation needs different treatment,
but be loud about it.

- New logic goes in `lib/` with a 100%-covering test.
- `app/` stays thin. No decisions in glue.
- Don't widen lint caps, add `eslint-disable`, or skip hooks to land a change.
- New storage/mailer/provider = a new adapter, not a special case.
- New env var → `.env.example` and the README table.
- New route that needs non-default gating → update `lib/routes.ts` and its test.
- Run `pnpm verify` before you push. It's the same gate CI runs.
